/**
 * Pluggable cache strategy used by `IRouter` implementations to
 * memoize `lookup(path)` results by request path. The default
 * implementation (`LruCache`) is a `quick-lru`-backed bounded LRU;
 * users can supply their own `ICache` (e.g. wrapping `lru-cache` for
 * TTL/size-based eviction) via `BaseRouterOptions.cache`, or pass
 * `null` to disable caching.
 *
 * The cache is opaque about value type so the same `ICache`
 * implementation can be reused for non-router caching needs.
 */
export interface ICache<V> {
    /**
     * Return the cached value for `key`, or `undefined` when the key
     * is absent (or has been evicted). Implementations should treat
     * `undefined` as "no entry" — callers cannot store `undefined`.
     * Other falsy values (`null`, `0`, `''`, `false`) are storable
     * and must be returned unchanged on hit.
     */
    get(key: string): V | undefined;

    /**
     * Store `value` under `key`. Bounded implementations (LRU, TTL,
     * size-based) decide eviction at this point.
     */
    set(key: string, value: V): void;

    /**
     * Remove a single entry. No-op when `key` is absent.
     */
    delete(key: string): void;

    /**
     * Drop every entry. Routers call this from inside `add()` so a
     * newly registered route can never be hidden by stale matches
     * cached against an earlier route set.
     */
    clear(): void;

    /**
     * Return a fresh, **empty** cache of the same shape — same class
     * for leaf implementations. Used by `IRouter.clone()` so the
     * clone preserves the configured cache family (size, eviction
     * policy, …) without inheriting the parent's cached values.
     * Mirrors `IRouter.clone()`.
     */
    clone(): ICache<V>;
}
