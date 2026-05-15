# Custom Cache

Each `IRouter` carries its own pluggable `ICache` for memoizing `lookup(path)` results. The default is a bounded LRU built on [`quick-lru`](https://github.com/sindresorhus/quick-lru) (`max=1024`), but you can supply your own implementation — for example, to wrap [`lru-cache`](https://github.com/isaacs/node-lru-cache) for TTL or size-based eviction — or pass `null` to disable caching for that router.

## Default behavior

```typescript
import { App, TrieRouter, defineCoreHandler } from 'routup';

// Implicitly: cache: new LruCache({ maxSize: 1024 })
const app = new App({ router: new TrieRouter() });
app.get('/users/:id', defineCoreHandler((event) => `user-${event.params.id}`));
```

Repeated requests to the same path skip the trie walk after the first hit. The cache is invalidated whenever `IRouter.add` is called (i.e. `app.use`/`.get`/`.post`/etc.) so newly added routes are always considered.

The same applies to `LinearRouter` — both built-in routers ship with a default LRU.

## Disabling the cache

```typescript
import { App, TrieRouter } from 'routup';

const app = new App({ router: new TrieRouter({ cache: null }) });
```

Use this when you don't want any path memoization — for example, on apps with very few routes where the cache lookup itself outweighs the saved router walk, or when your workload has high path cardinality and you don't want to spend memory on caching.

## Using a custom `LruCache` size

```typescript
import { App, TrieRouter, LruCache } from 'routup';

const app = new App({
    router: new TrieRouter({
        cache: new LruCache({ maxSize: 4096 }),
    }),
});
```

`maxSize` is the bound on entries (the underlying `quick-lru` keeps up to `2 * maxSize` due to its two-bucket rotation, but eventually evicts everything older).

## The `ICache<V>` contract

```typescript
export interface ICache<V> {
    get(key: string): V | undefined;
    set(key: string, value: V): void;
    delete(key: string): void;
    clear(): void;
    clone(): ICache<V>;
}
```

For router lookup caching, `V` is `readonly RouteMatch<T>[]` (the type returned by `IRouter.lookup`). The router's `BaseRouterOptions<T>` accepts `ICache<readonly RouteMatch<T>[]> | null` for its `cache` slot.

### Contract notes

- **`get(key)` returns `undefined` for absent keys.** Implementations cannot store `undefined` as a value; the absent-key sentinel and the no-cache-entry case are conflated, by design.
- **`clear()` drops every entry.** Called by the router on every `add()`. Conservative — future plans may switch to per-path invalidation.
- **`clone()` returns a fresh, empty cache of the same shape.** Used by `IRouter.clone()` so a cloned router preserves the configured cache family (size, eviction policy) without inheriting cached values. Mirrors `IRouter.clone()`.

## Wrapping `lru-cache` for TTL

```typescript
import { LRUCache } from 'lru-cache';
import { App, TrieRouter } from 'routup';
import type { ICache } from 'routup';

class TtlCache<V extends {}> implements ICache<V> {
    private inner = new LRUCache<string, V>({ max: 4096, ttl: 30_000 });

    get(key: string)        { return this.inner.get(key); }
    set(key: string, v: V)  { this.inner.set(key, v); }
    delete(key: string)     { this.inner.delete(key); }
    clear()                 { this.inner.clear(); }
    clone(): ICache<V>      { return new TtlCache<V>(); }
}

const app = new App({ router: new TrieRouter({ cache: new TtlCache() }) });
```

Same pattern works for any backend — wrap whatever cache library you already use into a thin `ICache` adapter.

## Why per-router (not per-App)?

In v6 the cache lived inside a wrapping router (`MemoizedRouter` around a `LinearRouter`/`TrieRouter`). v7 moves it onto each router class as part of `BaseRouterOptions`. Two reasons:

1. **Cohesion.** The cache memoizes `IRouter.lookup`. Putting it on the router that does the lookup keeps the concept and its invalidation point colocated — the router clears its own cache from inside `add()` instead of relying on an outer layer to know when routes changed.
2. **Custom routers opt out trivially.** A custom `IRouter` that's already O(1) (e.g. a hash-map table) can ignore the `cache` option entirely without paying any per-lookup overhead.

If you were using `MemoizedRouter` in v6, see the [v7 migration guide](./migration-v7) for the one-line equivalent.
