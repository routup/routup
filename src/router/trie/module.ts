import type { ObjectLiteral, Route, RouteMatch } from '../../types.ts';
import type { IRouter } from '../types.ts';
import { buildRoutePathMatcher } from '../utils.ts';
import type { IndexedRoute, Segment, TrieNode } from './types.ts';

import { createTrieNode } from './node.ts';

/**
 * Radix-trie resolver — registers routes into a per-segment tree at
 * `add()` time and walks the tree at `lookup()` to collect candidates
 * by structure rather than by linear scan.
 *
 * Inspired by Hono's `TrieRouter` and rou3. The trie handles routup's
 * path vocabulary (static segments, `:param`, `*` and `*name` splats);
 * registered paths that contain syntax outside this set (e.g. `{group}`,
 * regex bodies) safely fall through to a `universal` bucket walked
 * linearly on every request — so correctness is preserved at the cost
 * of the trie's per-request savings for those routes.
 *
 * The trie identifies candidate routes by structural compatibility;
 * each candidate's `IPathMatcher` is still run once to confirm and
 * extract `params` / `path` exactly as the linear resolver
 * would. Trade-off: one extra `matcher.exec` per candidate, in
 * exchange for skipping most non-matching routes entirely. T3 in
 * the trie roadmap removes the `matcher.exec` step.
 *
 * Pure-static-spine fast path (`shortCircuit`): when the request
 * walks a static spine with no param/splat/prefix siblings on any
 * traversed node, the leaf's `exactRoutes` is the full answer —
 * no need to walk the param branch or collect prefix candidates at
 * intermediate nodes. As soon as a branch is encountered, falls
 * through to the regular `walk`.
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

    constructor() {
        this._routes = [];
        this.root = createTrieNode<T>();
        this.universal = [];
    }

    add(route: Route<T>): void {
        const index = this._routes.length;
        this._routes.push(route);

        const indexed: IndexedRoute<T> = {
            route,
            index,
            matcher: buildRoutePathMatcher(route),
        };

        if (typeof route.path !== 'string' || route.path === '' || route.path === '/') {
            this.universal.push(indexed);
            return;
        }

        const segments = this.parseRoutePath(route.path);
        if (segments === null) {
            this.universal.push(indexed);
            return;
        }

        this.insertIntoTrie(segments, indexed);
    }

    lookup(path: string): readonly RouteMatch<T>[] {
        const candidates: IndexedRoute<T>[] = [];

        for (const u of this.universal) {
            candidates.push(u);
        }

        const segments = this.parseRequestPath(path);
        const shortCircuit = this.shortCircuit(segments);
        if (shortCircuit !== null) {
            for (const c of shortCircuit) {
                candidates.push(c);
            }
        } else {
            this.walk(this.root, segments, 0, candidates);
        }

        candidates.sort((a, b) => a.index - b.index);

        const matches: RouteMatch<T>[] = [];
        for (const candidate of candidates) {
            const {
                route,
                index,
                matcher,
            } = candidate;

            if (matcher) {
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
                continue;
            }

            // No matcher → route has no mount path (middleware /
            // mount-less router). Matches every request.
            matches.push({
                route,
                index,
                params: Object.create(null) as Record<string, unknown>,
            });
        }

        return matches;
    }

    get routes(): readonly Route<T>[] {
        return this._routes;
    }

    clone(): IRouter<T> {
        return new TrieRouter<T>();
    }

    /**
     * T1: returns the pre-computed candidate list when the request's
     * static spine has no param sibling, no prefix routes, and no
     * splats along the way. The leaf node's `exactRoutes` is then
     * the complete answer — no need to walk the param branch or
     * collect prefix/splat candidates from intermediate nodes. When
     * any branch is encountered, returns `null` and the caller falls
     * through to the regular `walk`.
     */
    protected shortCircuit(segments: string[]): IndexedRoute<T>[] | null {
        let node = this.root;

        for (const segment of segments) {
            // Any branch at this node disqualifies the fast path: a
            // param-child might match the current segment, a splat
            // would fire, and prefix routes would belong in the
            // result. All of these need the full walk.
            if (node.paramChild || node.splatRoutes.length > 0 || node.prefixRoutes.length > 0) {
                return null;
            }

            const child = node.staticChildren.get(segment!);
            if (!child) {
                return null;
            }
            node = child;
        }

        if (node.paramChild || node.splatRoutes.length > 0 || node.prefixRoutes.length > 0) {
            return null;
        }

        // Pure static spine reached the leaf — `exactRoutes` is the
        // complete answer for this request.
        return node.exactRoutes;
    }

    /**
     * Parse a registered path into a list of segments. Returns `null`
     * when the path contains syntax this resolver doesn't handle
     * (regex bodies, optional groups, etc.) — the caller then falls
     * back to the universal bucket so correctness is preserved.
     */
    protected parseRoutePath(path: string): Segment[] | null {
        const trimmed = path.charAt(0) === '/' ? path.slice(1) : path;
        if (trimmed === '') {
            return [];
        }

        const parts = trimmed.split('/');
        const result: Segment[] = [];

        for (const part of parts) {
            if (part === '') {
                continue;
            }
            if (part === '*' || (part.charAt(0) === '*' && /^\*[a-zA-Z_]\w*$/.test(part))) {
                result.push({ kind: 'splat' });
                continue;
            }
            if (part.charAt(0) === ':' && /^:[a-zA-Z_]\w*$/.test(part)) {
                result.push({ kind: 'param' });
                continue;
            }
            if (/^[a-zA-Z0-9_\-.~%]+$/.test(part)) {
                result.push({ kind: 'static', value: part });
                continue;
            }
            return null;
        }

        return result;
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

    protected insertIntoTrie(segments: Segment[], indexed: IndexedRoute<T>): void {
        let node = this.root;
        const exact = this.isExactMatchRoute(indexed.route);

        for (const seg of segments) {
            if (seg.kind === 'splat') {
                node.splatRoutes.push(indexed);
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

        if (exact) {
            node.exactRoutes.push(indexed);
        } else {
            node.prefixRoutes.push(indexed);
        }
    }

    protected walk(
        node: TrieNode<T>,
        segments: string[],
        depth: number,
        collected: IndexedRoute<T>[],
    ): void {
        // Splats at this depth match any request path that reaches here.
        for (const s of node.splatRoutes) {
            collected.push(s);
        }

        if (depth === segments.length) {
            // Request path is fully consumed at this node: collect
            // both exact-match and prefix-match routes that ended here.
            for (const e of node.exactRoutes) {
                collected.push(e);
            }
            for (const p of node.prefixRoutes) {
                collected.push(p);
            }
            return;
        }

        // Going deeper — prefix routes at this node match any
        // continuation (middleware / nested routers).
        for (const p of node.prefixRoutes) {
            collected.push(p);
        }

        const seg = segments[depth]!;

        const staticChild = node.staticChildren.get(seg);
        if (staticChild) {
            this.walk(staticChild, segments, depth + 1, collected);
        }

        if (node.paramChild) {
            this.walk(node.paramChild, segments, depth + 1, collected);
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
