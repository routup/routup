import type { ICache } from '../cache/index.ts';
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
     */
    lookup(path: string): readonly RouteMatch<T>[];

    /**
     * Optional: every registered entry in registration order.
     *
     * `App` keeps its own copy of every route it registers, so it
     * never has to call back into the router for enumeration. This
     * field is kept on the contract as a convenience for direct
     * router consumers (and the built-in routers happen to maintain
     * it for free since they hold the list anyway), but custom
     * routers — including future aggregated/compiled implementations
     * that may discard the original entries after building their
     * lookup structure — are free to omit it.
     */
    readonly routes?: readonly Route<T>[];

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
