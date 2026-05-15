import type { ICache } from '../cache/index.ts';
import type { MethodNameLike } from '../constants.ts';
import type { ObjectLiteral, Route, RouteMatch } from '../types.ts';

/**
 * Options shared by every built-in router. Custom `IRouter`
 * implementations are encouraged to extend this so users can swap
 * routers without rewiring caching.
 *
 * - `cache` (omitted): no caching — every `lookup()` runs the
 *   router's full match logic. This is the default.
 * - `cache: <ICache>`: enable lookup memoization. Pass `LruCache`
 *   for the built-in bounded LRU, or your own `ICache` (e.g.
 *   wrapping `lru-cache` for TTL or size-based eviction).
 *
 * The router is responsible for invalidating its own cache whenever
 * `add()` is called — registering a new route can change the match
 * set for any cached path.
 */
export type BaseRouterOptions<T extends ObjectLiteral = ObjectLiteral> = {
    cache?: ICache<readonly RouteMatch<T>[]>;
};

/**
 * Pluggable strategy for storing routes and answering "which entries
 * match this path?". The default `LinearRouter` walks the stored
 * entries linearly. Alternative implementations (radix tree,
 * aggregated regex, …) can swap in via `AppContext.router` to
 * skip the walk entirely on apps with many routes.
 *
 * The router operates on `Route<T>` where `T` is opaque data; the
 * router never inspects `entry.data`. Only `entry.path` and
 * `entry.method` are routing-relevant.
 *
 * **Match-semantics convention** (custom implementations must honor):
 * - `entry.method !== undefined` → match the path **exactly** (the
 *   entry is method-bound, e.g. a verb-shortcut handler).
 * - `entry.method === undefined` → match by **prefix** (middleware,
 *   nested apps).
 *
 * Method matching against the request method is kept at the dispatch-
 * loop call site, not here, because method semantics differ between
 * handler and nested-app entries (only handler entries are
 * method-bound).
 */
export interface IRouter<T extends ObjectLiteral = ObjectLiteral> {
    /**
     * Register a route. Entries are stored in registration order —
     * the order they were passed to `App.use` / `.get` / `.post` /
     * etc. — and lookup results preserve that order.
     */
    add(route: Route<T>): void;

    /**
     * Return every entry that matches the given path, in registration
     * order. The dispatch loop iterates this list; nested `setNext`
     * re-entries resume from a later index in the same list.
     *
     * `method`, when provided, is the request HTTP method. Routers
     * MAY use it to filter at lookup time (e.g. method-bucketed
     * tries) — but the App's dispatch loop still runs its own
     * method check on every returned match, so a router that
     * ignores `method` and emits more candidates than necessary
     * stays correct, just not optimally fast.
     *
     * When the request method is `OPTIONS` (auto-Allow surface) or
     * `HEAD` (falls through to GET), method-aware routers should
     * widen their emission to cover those cases — see the OPTIONS /
     * HEAD handling notes on `TrieRouter` for the canonical
     * implementation.
     */
    lookup(path: string, method?: MethodNameLike): readonly RouteMatch<T>[];

    /**
     * Return a fresh, **empty** router of the same shape — same class
     * for leaf implementations; composable wrappers should recursively
     * clone their inner router. Used by `App.install()` and
     * `App.clone()` so plugin sub-apps and cloned apps preserve the
     * active router family instead of silently downgrading to
     * `LinearRouter`.
     */
    clone(): IRouter<T>;
}
