import type { IPathMatcher } from '../../path/index.ts';
import type { ObjectLiteral, Route } from '../../types.ts';

/**
 * Tagged param-extraction instruction. Built at registration time
 * during `insertIntoTrie`; consumed at lookup time to build the
 * params object directly from the request's pre-split segments —
 * no regex execution per match.
 *
 * - `segment`: capture `segments[depth]` as `name`.
 * - `splat`: capture `segments[depth..]` joined with `/` as `name`.
 *   `name` is `'*'` for the unnamed bare splat (`/files/*`).
 */
export type ParamCapture = {
    kind: 'segment';
    depth: number;
    name: string;
} | {
    kind: 'splat';
    depth: number;
    name: string;
};

/**
 * Per-variant route record stored at a trie leaf.
 *
 * `paramsIndexMap` populated for trie-walked variants so lookup can
 * extract params without running `matcher.exec`. `matcher` is only
 * populated for universal-bucket routes (registered paths the trie
 * parser couldn't handle — regex constraints, compound segments,
 * escapes — that fall back to path-to-regexp).
 *
 * `index` is shared across every variant produced from a single
 * `add()` call so the candidate list deduplicates naturally on
 * registration order.
 */
export type IndexedRoute<T extends ObjectLiteral = ObjectLiteral> = {
    route: Route<T>;
    index: number;
    /**
     * Universal-bucket-only — populated for paths the trie parser
     * couldn't handle (regex constraints, compound segments, escapes).
     * The lookup loop runs `matcher.exec(path)` to confirm the match
     * and extract params, identical to `LinearRouter`.
     */
    matcher?: IPathMatcher;
    /**
     * Trie-walked-only — populated for variants that came out of
     * `parsePath`. The lookup loop walks this list to build the
     * `params` object directly from request segments, no regex.
     */
    paramsIndexMap?: ParamCapture[];
    /**
     * Trie-walked-only — how many request segments this variant
     * consumes when matched. Used to compute `match.path` (the
     * matched prefix) at lookup time without re-running a matcher.
     *
     * - Exact / prefix variants: `segments.length` (consume up to
     *   the leaf).
     * - Splat variants: depth of the splat segment (it then absorbs
     *   the rest — see `splatTerminated`).
     */
    matchDepth?: number;
    /**
     * Trie-walked-only — `true` when this variant ends in a splat.
     * `match.path` is then computed from the *full* request length
     * (the splat absorbed every remaining segment), not from
     * `matchDepth` (which is only the depth of the splat node).
     */
    splatTerminated?: boolean;
};

export type Segment = { kind: 'static'; value: string } |
    { kind: 'param'; name: string } |
    { kind: 'splat'; name: string };

/**
 * Method-keyed bucket of indexed routes. The empty-string key
 * (`''`) holds method-agnostic entries (handlers registered without
 * a method binding). Stored as a prototype-less object so user-
 * controlled method strings can't collide with `Object.prototype`
 * keys (`__proto__`, `hasOwnProperty`, …).
 */
export type MethodBuckets<T extends ObjectLiteral = ObjectLiteral> = Record<
    string,
    IndexedRoute<T>[]
>;

export type TrieNode<T extends ObjectLiteral = ObjectLiteral> = {
    staticChildren: Map<string, TrieNode<T>>;
    paramChild?: TrieNode<T>;
    /**
     * Entries whose path ends with a splat at this depth (`/files/*`,
     * `/foo/*name`, …). They match the current node and every deeper
     * request path. Bucketed by HTTP method (`''` = method-agnostic).
     */
    splatRoutes: MethodBuckets<T>;
    /**
     * Exact-match routes whose path ends at this node — only matched
     * when the request path is fully consumed at this depth.
     * Bucketed by HTTP method (`''` = method-agnostic).
     */
    exactRoutes: MethodBuckets<T>;
    /**
     * Prefix-match routes (middleware / nested apps) whose path ends
     * at this node — matched whenever this node is reached,
     * regardless of remaining depth. Not bucketed: middleware is
     * method-agnostic by design (the inner handler does its own
     * method discrimination).
     */
    prefixRoutes: IndexedRoute<T>[];
};

