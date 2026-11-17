# Routers

A router is the route table of an App: it stores the registered routes and returns the ones that match a request path. Each router can memoize its lookups in a cache. Writing your own router is covered in [Custom Router](/guide/custom-router), writing your own cache in [Custom Cache](/guide/custom-cache).

```typescript
import { App, LruCache, TrieRouter } from 'routup';

const app = new App({
    router: new TrieRouter({ cache: new LruCache({ maxSize: 4096 }) }),
});
```

## `IRouter`

```typescript
interface IRouter<T extends ObjectLiteral = ObjectLiteral> {
    add(route: Route<T>): void;
    lookup(path: string, method?: MethodNameLike): readonly RouteMatch<T>[];
}
```

The contract every router implements; `T` is the type of each route's `data`, an `ObjectLiteral` (`Record<string, any>`). Pass one as `router` to [`new App()`](/api/app#appcontext) or to `app.setRouter()`.

- `lookup()` returns the matching routes in the order they were added.
- A route with a `method` matches its path exactly. A route without one matches every path that starts with its path.
- The App checks the method of every returned match itself, so a router may ignore `method` and return more matches.
- The [contract section of Custom Router](/guide/custom-router#the-irouter-t-contract) explains `Route` and `RouteMatch`.

## `LinearRouter`

```typescript
declare class LinearRouter<T extends ObjectLiteral = ObjectLiteral> implements IRouter<T> {
    constructor(options?: BaseRouterOptions<T>);
}
```

The default router of an App. Each lookup tests every route in order with a `path-to-regexp` matcher and ignores `method`.

## `TrieRouter`

```typescript
declare class TrieRouter<T extends ObjectLiteral = ObjectLiteral> implements IRouter<T> {
    constructor(options?: BaseRouterOptions<T>);
}
```

A router that stores routes in a tree of path segments, grouped by method, instead of testing each route in turn.

- The tree holds static segments, `:name` parameters, optional parameters and groups, and `*` or `*name` wildcards.
- Routes without a path or with the path `/`, and routes with syntax the tree does not hold (`/files/:name.ext`, escapes), are kept in a list that every lookup checks, as `LinearRouter` does.
- Its cache key is the method and the path.

## `SmartRouter`

```typescript
declare class SmartRouter<T extends ObjectLiteral = ObjectLiteral> implements IRouter<T> {
    constructor(options?: SmartRouterOptions<T>);
}

type SmartRouterOptions<T extends ObjectLiteral = ObjectLiteral> = BaseRouterOptions<T> & {
    threshold?: number,
};
```

A router that picks `LinearRouter` or `TrieRouter` on its first lookup, from the number of routes added until then. Every later call goes to the router it picked.

| Name | Type | Default | Meaning |
|---|---|---|---|
| `threshold` | `number` | `30` | With this many routes or more, it picks `TrieRouter`; with fewer, `LinearRouter` |
| `cache` | `ICache` | none | Passed on to the router it picks |

## `BaseRouterOptions`

```typescript
type BaseRouterOptions<T extends ObjectLiteral = ObjectLiteral> = {
    cache?: ICache<readonly RouteMatch<T>[]>,
};
```

The options of the built-in routers.

| Name | Type | Default | Meaning |
|---|---|---|---|
| `cache` | `ICache<readonly RouteMatch<T>[]>` | none: no caching | Stores lookup results; each router picks the key (`LinearRouter`: the path, `TrieRouter`: the method and the path) |

The built-in routers clear the cache on every `add()`.

## `buildRoutePathMatcher`

```typescript
declare function buildRoutePathMatcher<T extends ObjectLiteral = ObjectLiteral>(
    route: Route<T>,
): IPathMatcher | undefined;
```

Builds the `path-to-regexp` matcher the built-in routers use for a route: an exact match when the route has a `method`, a prefix match otherwise. For use in a [custom router](/guide/custom-router#recommended-helpers).

- It returns `undefined` for a route without a path, and for a route with the path `/` and no `method`. Such a route matches every request.
- The matcher is a [`PathMatcher`](/api/advanced#pathmatcher).

## `ICache`

```typescript
interface ICache<V> {
    get(key: string): V | undefined;
    set(key: string, value: V): void;
    clear(): void;
}
```

The contract of a router's lookup cache. See [Custom Cache](/guide/custom-cache#the-icache-v-contract).

- `get()` returns `undefined` for a missing entry, so `undefined` cannot be stored. Other falsy values can.
- A bounded cache evicts in `set()`.

## `LruCache`

```typescript
declare class LruCache<V> implements ICache<V> {
    constructor(options?: LruCacheOptions);
}

type LruCacheOptions = {
    maxSize?: number,
};
```

A bounded cache that evicts the least recently used entries, built on [`quick-lru`](https://github.com/sindresorhus/quick-lru).

| Name | Type | Default | Meaning |
|---|---|---|---|
| `maxSize` | `number` | `1024` | Number of entries before the least recently used ones are evicted |

Next to the `ICache` methods it has `delete(key)`.
