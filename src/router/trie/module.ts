import { AppStackEntryType } from '../../app/constants.ts';
import type { StackEntry } from '../../app/types.ts';
import type { IRouter, RouterMatch } from '../types.ts';
import { buildEntryPathMatcher } from '../utils.ts';
import type { IndexedEntry, Segment, TrieNode } from './types.ts';
import { createTrieNode } from './types.ts';

/**
 * Radix-trie resolver — registers entries into a per-segment tree at
 * `add()` time and walks the tree at `lookup()` to collect candidates
 * by structure rather than by linear scan.
 *
 * Inspired by Hono's `TrieApp` and rou3. The trie handles routup's
 * path vocabulary (static segments, `:param`, `*` and `*name` splats);
 * registered paths that contain syntax outside this set (e.g. `{group}`,
 * regex bodies) safely fall through to a `universal` bucket walked
 * linearly on every request — so correctness is preserved at the cost
 * of the trie's per-request savings for those entries.
 *
 * The trie identifies candidate entries by structural compatibility;
 * each candidate's `IPathMatcher` is still run once to confirm and
 * extract `params` / `matchedPath` exactly as the linear resolver
 * would. Trade-off: one extra `matcher.exec` per candidate, in
 * exchange for skipping most non-matching entries entirely. T3 in
 * the trie roadmap removes the `matcher.exec` step.
 *
 * T1 fast path: when the request walks a purely-static spine (no
 * param siblings, no prefix entries, no splats encountered) the trie
 * walk degenerates into "lookup leaf entries by full path." The
 * `staticRoutes` map captures exactly that case — a single hash
 * probe replaces the per-segment descent. When the spine has any
 * branch the probe misses and the regular trie walk runs.
 */
export class TrieRouter implements IRouter {
    protected _entries: StackEntry[] = [];

    protected root: TrieNode = createTrieNode();

    /**
     * Entries that bypass the trie — registered with no path, with
     * the root path `/`, or with a path containing syntax we don't
     * parse. Walked linearly on every lookup, merged into the result
     * in registration order.
     */
    protected universal: IndexedEntry[] = [];

    /**
     * T1 fast path. Each key is a canonicalized fully-static path; the
     * value is the list of leaf exact-match entries registered at that
     * path. Only consulted when the request path's static spine has
     * no param/splat/prefix siblings on the way (`canShortCircuitToStatic`).
     */
    protected staticRoutes: Map<string, IndexedEntry[]> = new Map();

    add(entry: StackEntry): void {
        const index = this._entries.length;
        this._entries.push(entry);

        const indexed: IndexedEntry = {
            entry,
            index,
            matcher: buildEntryPathMatcher(entry),
        };

        if (typeof entry.path !== 'string' || entry.path === '' || entry.path === '/') {
            this.universal.push(indexed);
            return;
        }

        const segments = this.parseRoutePath(entry.path);
        if (segments === null) {
            this.universal.push(indexed);
            return;
        }

        this.insertIntoTrie(segments, indexed);

        // T1: index in the static map when every segment is static
        // *and* the entry is method-bound. The trie still holds the
        // entry too — the map is a probe, not a replacement.
        if (this.isExactMatchEntry(indexed.entry) && segments.every((s) => s.kind === 'static')) {
            const key = this.canonicalize(entry.path);
            let bucket = this.staticRoutes.get(key);
            if (!bucket) {
                bucket = [];
                this.staticRoutes.set(key, bucket);
            }
            bucket.push(indexed);
        }
    }

    lookup(path: string): readonly RouterMatch[] {
        const candidates: IndexedEntry[] = [];

        for (const u of this.universal) {
            candidates.push(u);
        }

        const segments = this.parseRequestPath(path);
        const shortCircuit = this.shortCircuit(segments, path);
        if (shortCircuit !== null) {
            for (const c of shortCircuit) {
                candidates.push(c);
            }
        } else {
            this.walk(this.root, segments, 0, candidates);
        }

        candidates.sort((a, b) => a.index - b.index);

        const matches: RouterMatch[] = [];
        for (const candidate of candidates) {
            const {
                entry,
                index,
                matcher,
            } = candidate;

            if (matcher) {
                const output = matcher.exec(path);
                if (typeof output === 'undefined') {
                    continue;
                }
                matches.push({
                    entry,
                    index,
                    params: this.assignParams(output.params),
                    matchedPath: output.path,
                });
                continue;
            }

            // No matcher → entry has no mount path (middleware /
            // mount-less router). Matches every request.
            matches.push({
                entry,
                index,
                params: Object.create(null) as Record<string, unknown>,
            });
        }

        return matches;
    }

    get entries(): readonly StackEntry[] {
        return this._entries;
    }

    /**
     * T1: returns the pre-computed candidate list when the request's
     * static spine has no param sibling, no prefix entries, and no
     * splats along the way — meaning the regular `walk` would yield
     * exactly the leaf entries the static map contains. Otherwise
     * returns `null` and the caller falls through to `walk`.
     */
    protected shortCircuit(segments: string[], path: string): IndexedEntry[] | null {
        let node = this.root;

        for (const segment of segments) {
            // Any branch at this node disqualifies the fast path: a
            // param-child might match the current segment, a splat
            // would fire, and prefix entries would belong in the
            // result. All of these need the full walk.
            if (node.paramChild || node.splatEntries.length > 0 || node.prefixEntries.length > 0) {
                return null;
            }

            const child = node.staticChildren.get(segment!);
            if (!child) {
                return null;
            }
            node = child;
        }

        if (node.paramChild || node.splatEntries.length > 0 || node.prefixEntries.length > 0) {
            return null;
        }

        // Reached the leaf node along a pure static spine.
        // The static map is keyed by canonical path; the trie walk
        // would arrive at this same leaf and emit `exactEntries`.
        const leaf = this.staticRoutes.get(this.canonicalize(path));
        return leaf ?? node.exactEntries;
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

    /**
     * Canonicalize a path string into the `staticRoutes` key. Strips
     * a leading slash and a single trailing slash so registered
     * `/users` and request `/users` share one bucket.
     */
    protected canonicalize(path: string): string {
        let p = path;
        if (p.charAt(0) === '/') {
            p = p.slice(1);
        }
        if (p.length > 0 && p.charAt(p.length - 1) === '/') {
            p = p.slice(0, -1);
        }
        return p;
    }

    protected insertIntoTrie(segments: Segment[], indexed: IndexedEntry): void {
        let node = this.root;
        const exact = this.isExactMatchEntry(indexed.entry);

        for (const seg of segments) {
            if (seg.kind === 'splat') {
                node.splatEntries.push(indexed);
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
            node.exactEntries.push(indexed);
        } else {
            node.prefixEntries.push(indexed);
        }
    }

    protected walk(
        node: TrieNode,
        segments: string[],
        depth: number,
        collected: IndexedEntry[],
    ): void {
        // Splats at this depth match any request path that reaches here.
        for (const s of node.splatEntries) {
            collected.push(s);
        }

        if (depth === segments.length) {
            // Request path is fully consumed at this node: collect
            // both exact-match and prefix-match entries that ended here.
            for (const e of node.exactEntries) {
                collected.push(e);
            }
            for (const p of node.prefixEntries) {
                collected.push(p);
            }
            return;
        }

        // Going deeper — prefix entries at this node match any
        // continuation (middleware / nested routers).
        for (const p of node.prefixEntries) {
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

    protected isExactMatchEntry(entry: StackEntry): boolean {
        if (entry.type === AppStackEntryType.APP) {
            return false;
        }
        return typeof entry.method !== 'undefined' ||
            typeof entry.data.method !== 'undefined';
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
