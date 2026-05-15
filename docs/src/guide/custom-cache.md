# Custom Cache

`IRouter` implementations can carry an optional `ICache` for memoizing `lookup(path)` results. Caching is **opt-in**: by default, every `lookup` runs the router's full match logic. To enable memoization, pass an `ICache` via `BaseRouterOptions.cache`.

The shipped default implementation is `LruCache`, a bounded LRU built on [`quick-lru`](https://github.com/sindresorhus/quick-lru). For TTL or size-based eviction, write a small adapter around [`lru-cache`](https://github.com/isaacs/node-lru-cache) (or any other cache library) that satisfies the `ICache` contract.

## Default behavior — no cache

```typescript
import { App, TrieRouter, defineCoreHandler } from 'routup';

// No cache — every request runs the trie walk.
const app = new App({ router: new TrieRouter() });
app.get('/users/:id', defineCoreHandler((event) => `user-${event.params.id}`));
```

For most workloads (small route counts, modest throughput, varied paths) this is the right default — there's no per-router LRU allocation, no extra dependency in your bundle, and no chance of surprise behavior in tests when routes mutate.

## Enabling the LRU cache

```typescript
import { App, TrieRouter, LruCache } from 'routup';

const app = new App({
    router: new TrieRouter({ cache: new LruCache() }),  // max=1024 by default
});
```

Repeated requests to the same path then skip the trie walk after the first hit. The cache is invalidated whenever `IRouter.add` is called (i.e. `app.use`/`.get`/`.post`/etc.) so newly added routes are always considered.

## Custom `LruCache` size

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

For router lookup caching, `V` is `readonly RouteMatch<T>[]` (the type returned by `IRouter.lookup`).

### Contract notes

- **`get(key)` returns `undefined` for absent keys.** Implementations cannot store `undefined` as a value; the absent-key sentinel and the no-cache-entry case are conflated, by design. Other falsy values (`null`, `0`, `''`, `false`) are valid cached payloads.
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

## When to enable caching

Enable when:
- Lookup is non-trivial (large route count, parametric/regex paths) **and**
- The same paths are requested repeatedly (e.g. an API where most traffic hits a handful of canonical routes)

Skip caching when:
- Route count is small and the linear/trie walk is already cheap
- Path cardinality is high and unbounded (cache hits would be rare; bound is forced)
- Determinism in tests matters more than per-lookup speed

Benchmark before enabling — the default-off shape exists because the gain is workload-dependent and often within noise.
