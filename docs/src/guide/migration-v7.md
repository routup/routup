# Migrating to v7

Routup v7 introduces a pluggable lookup cache (`ICache`, default `LruCache`) on every router and removes `MemoizedRouter`. Caching moves from a router-decorator concern to a first-class option on each `IRouter` implementation.

If you didn't use `MemoizedRouter` in v6, the only visible change is a free perf bump: every router now has a bounded LRU on lookups by default.

## Quick summary

| v6 | v7 |
|----|-----|
| `new MemoizedRouter(inner)` | _removed_ — caching is now a per-router `cache` option |
| `new App({ router: new MemoizedRouter(new TrieRouter()) })` | `new App({ router: new TrieRouter() })` (default LRU is on) |
| _no way to disable router-level cache without dropping the wrapper_ | `new TrieRouter({ cache: null })` |
| _no way to bound the cache size_ | `new TrieRouter({ cache: new LruCache({ maxSize: 4096 }) })` |

## What changed

**`MemoizedRouter` is gone.** Its job — memoizing `IRouter.lookup(path)` results — is now done by `LinearRouter` and `TrieRouter` directly through the new `cache` constructor option.

**Routers accept `BaseRouterOptions<T>`:**

```typescript
type BaseRouterOptions<T> = {
    cache?: ICache<readonly RouteMatch<T>[]> | null;
};

new LinearRouter<T>(options?: BaseRouterOptions<T>);
new TrieRouter<T>(options?: BaseRouterOptions<T>);
```

- **Omitted / `undefined`:** the router constructs a `LruCache(1024)`. Best perf out of the box.
- **`null`:** caching disabled for that router.
- **Custom `ICache`:** swap in your own (e.g. wrapping `lru-cache` for TTL).

**Default behavior changed.** v6 only cached when you explicitly used `MemoizedRouter`. v7 caches by default with a `1024`-entry LRU bound. The bound makes the default safe even on cardinality-heavy paths — no memory leaks like the old unbounded `MemoizedRouter` had.

**App is unchanged.** `AppOptionsInput` does not gain a `cache` option; caching is a router concern.

## Migration recipes

### You used `MemoizedRouter`

Mechanical rewrite — drop the wrapper, the default is at least as good:

```typescript
// v6
new App({ router: new MemoizedRouter(new TrieRouter()) });

// v7
new App({ router: new TrieRouter() });          // default LRU(1024) on
```

If you were relying on `MemoizedRouter`'s **unbounded** cache (rare; usually a misfeature), pick a bound that fits:

```typescript
new App({
    router: new TrieRouter({
        cache: new LruCache({ maxSize: 16_384 }),
    }),
});
```

### You didn't use `MemoizedRouter`

Nothing to do. Your router now has a bounded LRU on lookups by default. If you want the old "no caching" behavior:

```typescript
new App({ router: new TrieRouter({ cache: null }) });
// or
new App({ router: new LinearRouter({ cache: null }) });
```

### You implemented `IRouter` from scratch

The interface itself (`add`, `lookup`, `routes`, `clone`) is unchanged. If you want your router to participate in the shared `cache` option, accept `BaseRouterOptions<T>` in your constructor and consult `this.cache` inside `lookup`:

```typescript
import { LruCache } from 'routup';
import type { BaseRouterOptions, ICache, IRouter, Route, RouteMatch } from 'routup';

class MyRouter<T> implements IRouter<T> {
    private cache: ICache<readonly RouteMatch<T>[]> | null;

    constructor(options: BaseRouterOptions<T> = {}) {
        this.cache = options.cache === null
            ? null
            : (options.cache ?? new LruCache());
    }

    add(route: Route<T>) {
        /* ...store route... */
        this.cache?.clear();
    }

    lookup(path: string): readonly RouteMatch<T>[] {
        // Use `typeof !== 'undefined'` rather than truthiness — the
        // `ICache<V>` contract reserves only `undefined` as the absent
        // sentinel; other falsy values (`null`, `0`, `''`, `false`)
        // are valid cached payloads for general `V`.
        const cached = this.cache?.get(path);
        if (typeof cached !== 'undefined') return cached;
        const matches = /* ...resolve... */ [];
        this.cache?.set(path, matches);
        return matches;
    }
    /* ...routes, clone... */
}
```

Custom routers that don't want caching (e.g. an O(1) hash-map table) can ignore `options.cache` entirely.

### You wrote a wrapper-router that cached lookups

If you wrote a custom router that wraps another router and caches its results (the same shape as `MemoizedRouter` did), rewrite it as an `ICache` instead and pass it via `BaseRouterOptions.cache`:

```typescript
// v6 — composable router
class MyCachingRouter implements IRouter { /* wraps inner.lookup() */ }
new App({ router: new MyCachingRouter(new TrieRouter()) });

// v7 — cache is the router's own slot
class MyCache implements ICache<...> { /* ... */ }
new App({ router: new TrieRouter({ cache: new MyCache() }) });
```

See the [Custom Cache guide](./custom-cache) for the full `ICache` contract.

## Why per-router?

Two reasons:

1. **Cohesion.** The cache memoizes `IRouter.lookup`. Putting it on the router that performs the lookup keeps the concept and its invalidation point colocated — the router clears its own cache from inside `add()` instead of relying on `App` to know when routes changed.
2. **Custom routers can opt out trivially.** A custom `IRouter` whose lookup is already O(1) (e.g. a hash-map table) can ignore the `cache` option entirely without paying any per-lookup overhead.

## Hook names, runtime behavior, request/response helpers

Unchanged from v6. No code outside the router-construction surface needs to move.
