import { MethodName } from '../../constants.ts';
import type { ICache } from '../../cache/index.ts';
import type { ObjectLiteral, Route, RouteMatch } from '../../types.ts';
import type { BaseRouterOptions, IRouter } from '../types.ts';
import { buildRoutePathMatcher } from '../utils.ts';
import type {
    IndexedRoute,
    MethodBuckets,
    ParamCapture,
    Segment,
    TrieNode,
} from './types.ts';
import { parsePath } from './parser.ts';

import { createTrieNode } from './node.ts';

function decodeOrRaw(s: string): string {
    try {
        return decodeURIComponent(s);
    } catch {
        return s;
    }
}

/**
 * Build a `params` object from a request's pre-split segments using
 * the variant's pre-computed `ParamCapture[]`. No regex execution —
 * each capture is one indexed read from `segments` (and a join for
 * splats). Replaces the `matcher.exec` confirm pass for trie-walked
 * routes (T3).
 */
function extractTrieParams(
    segments: string[],
    indexMap: ParamCapture[],
): Record<string, unknown> {
    const out = Object.create(null) as Record<string, unknown>;
    for (const cap of indexMap) {
        if (cap.kind === 'segment') {
            out[cap.name] = decodeOrRaw(segments[cap.depth]!);
        } else {
            // Splat: capture every remaining segment, joined with '/'.
            const slice = segments.slice(cap.depth).join('/');
            out[cap.name] = decodeOrRaw(slice);
        }
    }
    return out;
}

function trieMatchedPath(segments: string[], matchDepth: number): string {
    if (matchDepth === 0) {
        return '/';
    }
    return `/${segments.slice(0, matchDepth).join('/')}`;
}

/**
 * Pre-compute the `ParamCapture[]` for a variant's segments. Walk
 * the segments in order; emit one entry per `param` segment and a
 * terminal one for `splat` (always last). Static segments are
 * structurally consumed by the trie walk; they don't appear here.
 */
function buildParamsIndexMap(segments: Segment[]): ParamCapture[] {
    const out: ParamCapture[] = [];
    for (const [i, seg] of segments.entries()) {
        if (seg.kind === 'param') {
            out.push({
                kind: 'segment',
                depth: i,
                name: seg.name,
            });
        } else if (seg.kind === 'splat') {
            out.push({
                kind: 'splat',
                depth: i,
                name: seg.name,
            });
            // Splats are always last in a variant — the trie parser
            // emits at most one per variant.
            break;
        }
    }
    return out;
}

/**
 * Decide which method buckets a given request method should pull
 * from. Always includes `''` (method-agnostic). For HEAD also
 * includes GET (per `matchHandlerMethod`). For OPTIONS or no-method
 * lookups, returns `null` to signal "emit every bucket" — needed so
 * `event.methodsAllowed` is populated for OPTIONS auto-Allow and so
 * `IRouter.lookup(path)` (no method) keeps returning a complete
 * candidate set.
 */
function methodBucketKeys(method: string | undefined): readonly string[] | null {
    if (typeof method === 'undefined' || method === MethodName.OPTIONS) {
        return null;
    }
    if (method === MethodName.HEAD) {
        return ['', MethodName.HEAD, MethodName.GET];
    }
    return ['', method];
}

function emitBucket<T extends ObjectLiteral>(
    buckets: MethodBuckets<T>,
    method: string | undefined,
    out: IndexedRoute<T>[],
): void {
    const keys = methodBucketKeys(method);
    if (keys === null) {
        for (const k in buckets) {
            const list = buckets[k]!;
            for (const r of list) out.push(r);
        }
        return;
    }
    for (const k of keys) {
        const list = buckets[k];
        if (!list) continue;
        for (const r of list) out.push(r);
    }
}

function hasAnyBucket<T extends ObjectLiteral>(buckets: MethodBuckets<T>): boolean {
    // eslint-disable-next-line no-unreachable-loop
    for (const _k in buckets) {
        return true;
    }
    return false;
}

function pushIntoBucket<T extends ObjectLiteral>(
    buckets: MethodBuckets<T>,
    methodKey: string,
    route: IndexedRoute<T>,
): void {
    const bucket = buckets[methodKey];
    if (bucket) {
        bucket.push(route);
    } else {
        buckets[methodKey] = [route];
    }
}

/**
 * Radix-trie router — registers routes into a per-segment tree at
 * `add()` time and walks the tree at `lookup()` to collect
 * candidates by structure rather than by linear scan.
 *
 * Inspired by Hono's `TrieRouter` and rou3. The trie handles
 * routup's path vocabulary directly via its own parser
 * (`./parser.ts`):
 *
 *   - Static segments (`/users`)
 *   - Named params (`:id`)
 *   - Optional params (`:id?`) — expanded to two route variants at
 *     registration (T2)
 *   - Optional groups (`/users{/edit}`) — same expansion strategy
 *   - Bare and named splats (`/files/*`, `/files/*rest`)
 *
 * Per-leaf storage is bucketed by HTTP method (T4) so lookup
 * narrows to the request method's bucket(s) instead of emitting
 * every entry at the leaf and letting the dispatcher's filter
 * discard mismatches.
 *
 * Param extraction is `paramsIndexMap`-driven (T3): a pre-built
 * `Array<{ depth, name }>` per variant lets `extractTrieParams`
 * read params straight from the request's pre-split segments — no
 * regex execution per match.
 *
 * Paths the trie parser doesn't handle (compound segments like
 * `/files/:n.ext`, escape sequences `\:`, regex constraints) and
 * empty/root paths fall through to the `universal` bucket. That
 * bucket still uses `path-to-regexp` via `buildRoutePathMatcher`,
 * so correctness is preserved.
 *
 * Pure-static-spine fast path (`shortCircuit`): when the request
 * walks a static spine with no param/splat/prefix siblings on any
 * traversed node, the leaf's `exactRoutes` (filtered to the request
 * method's buckets) is the full answer — no need to walk the param
 * branch or collect prefix candidates at intermediate nodes.
 */
export class TrieRouter<T extends ObjectLiteral = ObjectLiteral> implements IRouter<T> {
    protected _routes: Route<T>[];

    protected root: TrieNode<T>;

    /**
     * Routes that bypass the trie — registered with no path, with
     * the root path `/`, or with a path containing syntax we don't
     * parse. Walked linearly on every lookup, merged into the result
     * in registration order.
     */
    protected universal: IndexedRoute<T>[];

    protected cache?: ICache<readonly RouteMatch<T>[]>;

    constructor(options: BaseRouterOptions<T> = {}) {
        this._routes = [];
        this.root = createTrieNode<T>();
        this.universal = [];
        this.cache = options.cache;
    }

    add(route: Route<T>): void {
        const index = this._routes.length;
        this._routes.push(route);

        // Empty/root paths bypass the trie entirely — they always
        // match every request and don't need a path-to-regexp matcher
        // either.
        if (typeof route.path !== 'string' || route.path === '' || route.path === '/') {
            this.universal.push({ route, index });
            this.cache?.clear();
            return;
        }

        const variants = parsePath(route.path);
        if (variants === null) {
            // Trie parser doesn't handle this syntax (regex
            // constraints, compound segments like `/files/:n.ext`,
            // escape sequences). Fall back to path-to-regexp.
            this.universal.push({
                route,
                index,
                matcher: buildRoutePathMatcher(route),
            });
            this.cache?.clear();
            return;
        }

        // Each variant becomes an `IndexedRoute` sharing the same
        // registration `index` so the candidate dedupe keeps them
        // collapsed to one match per request.
        for (const segments of variants) {
            this.insertIntoTrie(segments, route, index);
        }
        this.cache?.clear();
    }

    lookup(path: string, method?: string): readonly RouteMatch<T>[] {
        // Cache key includes the method bucket — different methods at
        // the same path now resolve to different candidate sets, so
        // sharing a cache entry across methods would leak matches.
        const cacheKey = `${method ?? ''}\t${path}`;
        const cached = this.cache?.get(cacheKey);
        if (typeof cached !== 'undefined') {
            return cached;
        }

        const candidates: IndexedRoute<T>[] = [];

        for (const u of this.universal) {
            candidates.push(u);
        }

        const segments = this.parseRequestPath(path);
        const shortCircuit = this.shortCircuit(segments, method);
        if (shortCircuit !== null) {
            for (const c of shortCircuit) {
                candidates.push(c);
            }
        } else {
            this.walk(this.root, segments, 0, candidates, method);
        }

        candidates.sort((a, b) => a.index - b.index);

        const matches: RouteMatch<T>[] = [];
        let lastIndex = -1; // dedupe — multiple variants of one route share `index`
        for (const candidate of candidates) {
            const {
                route,
                index,
                matcher,
                paramsIndexMap,
                matchDepth,
            } = candidate;

            if (index === lastIndex) {
                continue;
            }

            if (matcher) {
                // Universal-bucket route: still uses path-to-regexp.
                const output = matcher.exec(path);
                if (typeof output === 'undefined') {
                    continue;
                }
                matches.push({
                    route,
                    index,
                    params: this.assignParams(output.params),
                    path: output.path,
                });
                lastIndex = index;
                continue;
            }

            if (paramsIndexMap && typeof matchDepth === 'number') {
                // Trie-walked route: extract params from the request
                // segments using the pre-built index map. No regex.
                matches.push({
                    route,
                    index,
                    params: extractTrieParams(segments, paramsIndexMap),
                    path: trieMatchedPath(segments, matchDepth),
                });
                lastIndex = index;
                continue;
            }

            // Universal-bucket route with no matcher (empty / root path).
            matches.push({
                route,
                index,
                params: Object.create(null) as Record<string, unknown>,
            });
            lastIndex = index;
        }

        this.cache?.set(cacheKey, matches);
        return matches;
    }

    get routes(): readonly Route<T>[] {
        return this._routes;
    }

    clone(): IRouter<T> {
        // Carry the cache *shape* forward (not contents) — fresh
        // cache, same configured class/size. Absent stays absent.
        return new TrieRouter<T>({ cache: this.cache?.clone() });
    }

    /**
     * T1: returns the pre-computed candidate list when the request's
     * static spine has no param sibling, no prefix routes, and no
     * splats along the way. The leaf node's `exactRoutes` (filtered
     * to the request method's buckets) is then the complete answer —
     * no need to walk the param branch or collect prefix/splat
     * candidates from intermediate nodes. When any branch is
     * encountered, returns `null` and the caller falls through to
     * the regular `walk`.
     */
    protected shortCircuit(segments: string[], method: string | undefined): IndexedRoute<T>[] | null {
        let node = this.root;

        for (const segment of segments) {
            // Any branch at this node disqualifies the fast path: a
            // param-child might match the current segment, a splat
            // would fire, and prefix routes would belong in the
            // result. All of these need the full walk.
            if (node.paramChild || hasAnyBucket(node.splatRoutes) || node.prefixRoutes.length > 0) {
                return null;
            }

            const child = node.staticChildren.get(segment!);
            if (!child) {
                return null;
            }
            node = child;
        }

        if (node.paramChild || hasAnyBucket(node.splatRoutes) || node.prefixRoutes.length > 0) {
            return null;
        }

        // Pure static spine reached the leaf — `exactRoutes` (for the
        // request method's relevant buckets) is the complete answer.
        const out: IndexedRoute<T>[] = [];
        emitBucket(node.exactRoutes, method, out);
        return out;
    }

    protected parseRequestPath(path: string): string[] {
        const trimmed = path.charAt(0) === '/' ? path.slice(1) : path;
        if (trimmed === '') {
            return [];
        }
        const parts = trimmed.split('/');
        const result: string[] = [];
        for (const part of parts) {
            if (part !== '') {
                result.push(part);
            }
        }
        return result;
    }

    protected insertIntoTrie(segments: Segment[], route: Route<T>, index: number): void {
        let node = this.root;
        const exact = this.isExactMatchRoute(route);
        const methodKey = route.method ?? '';
        const paramsIndexMap = buildParamsIndexMap(segments);

        for (const [i, segment] of segments.entries()) {
            const seg = segment!;

            if (seg.kind === 'splat') {
                // Splat consumes the rest. `matchDepth` is the depth
                // of *this* trie node (one less than the splat's
                // index in `segments`, since the splat itself doesn't
                // create a child node). The splat capture in
                // `paramsIndexMap` already records that depth via
                // `cap.depth` — we slice from there at lookup.
                pushIntoBucket(node.splatRoutes, methodKey, {
                    route,
                    index,
                    paramsIndexMap,
                    matchDepth: i,
                });
                return;
            }

            if (seg.kind === 'param') {
                if (!node.paramChild) {
                    node.paramChild = createTrieNode();
                }
                node = node.paramChild;
                continue;
            }

            let child = node.staticChildren.get(seg.value);
            if (!child) {
                child = createTrieNode();
                node.staticChildren.set(seg.value, child);
            }
            node = child;
        }

        const indexed: IndexedRoute<T> = {
            route,
            index,
            paramsIndexMap,
            matchDepth: segments.length,
        };

        if (exact) {
            pushIntoBucket(node.exactRoutes, methodKey, indexed);
        } else {
            // Prefix routes (middleware / mounted apps) stay flat —
            // they're method-agnostic by design.
            node.prefixRoutes.push(indexed);
        }
    }

    protected walk(
        node: TrieNode<T>,
        segments: string[],
        depth: number,
        collected: IndexedRoute<T>[],
        method: string | undefined,
    ): void {
        // Splats at this depth match any request path that reaches here.
        emitBucket(node.splatRoutes, method, collected);

        if (depth === segments.length) {
            // Request path is fully consumed at this node: collect
            // both exact-match and prefix-match routes that ended here.
            emitBucket(node.exactRoutes, method, collected);
            for (const p of node.prefixRoutes) {
                collected.push(p);
            }
            return;
        }

        // Going deeper — prefix routes at this node match any
        // continuation (middleware / nested apps).
        for (const p of node.prefixRoutes) {
            collected.push(p);
        }

        const seg = segments[depth]!;

        const staticChild = node.staticChildren.get(seg);
        if (staticChild) {
            this.walk(staticChild, segments, depth + 1, collected, method);
        }

        if (node.paramChild) {
            this.walk(node.paramChild, segments, depth + 1, collected, method);
        }
    }

    protected isExactMatchRoute(route: Route<T>): boolean {
        return typeof route.method !== 'undefined';
    }

    /**
     * T5: copy params onto a prototype-less object so downstream
     * lookups skip prototype-chain traversal and avoid `__proto__` /
     * `hasOwnProperty` shadowing from user-controlled segment values.
     */
    protected assignParams(source: Record<string, unknown>): Record<string, unknown> {
        const out = Object.create(null) as Record<string, unknown>;
        for (const k in source) {
            if (Object.prototype.hasOwnProperty.call(source, k)) {
                out[k] = source[k];
            }
        }
        return out;
    }
}
