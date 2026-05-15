# Custom Router

Routup ships two built-in routers (`LinearRouter`, `TrieRouter`) but the router is fully pluggable. You can write your own — for example, to integrate a third-party route table or instrument lookups for tracing — and pass it to `App` via the `router` option. Path-level caching is a separate concern handled by the `cache` option (see the [Custom Cache guide](./custom-cache)).

The router contract is the `IRouter<T>` interface, generic over the per-route data you want to carry. `App` uses `IRouter<RouteEntry>` (where `RouteEntry` discriminates handler vs. nested-app), but `IRouter<T>` accepts any object-shaped `T` so the same router can be used standalone for routing problems that have nothing to do with `App`.

## The `IRouter<T>` contract

```typescript
interface IRouter<T extends ObjectLiteral = ObjectLiteral> {
    add(route: Route<T>): void;
    lookup(path: string): readonly RouteMatch<T>[];
    readonly routes: readonly Route<T>[];
    clone(): IRouter<T>;
}

type Route<T> = {
    path?: Path;
    method?: MethodName;
    data: T;
};

type RouteMatch<T> = {
    route: Route<T>;
    index: number;
    params: Record<string, any>;
    path?: string;
};
```

The router is responsible for `path` and `method` — `data` is **opaque** and must be returned as-is on match. The router should never inspect `data`.

### Exact-vs-prefix convention

Custom implementations must honor a single rule:

- `route.method !== undefined` → match the path **exactly** (the route is method-bound, e.g. `app.get('/users', …)`).
- `route.method === undefined` → match by **prefix** (middleware, nested app).

Method matching against the request's HTTP method stays at the dispatch-loop call site — your router only decides whether the *path* qualifies.

### Registration order

Lookup results must come back in registration order. The dispatch loop's `setNext` continuation relies on this: when a middleware calls `event.next()`, the pipeline resumes from `index + 1` in the same list.

### `clone()` returns an empty router

`App.clone()` and `App.install()` call `IRouter.clone()` to preserve the router family. The returned router must be:

- a fresh instance of the same shape (same class for leaf routers; composable wrappers should recursively clone their inner)
- **empty** — `App` re-registers routes on it; if `clone()` carried routes forward, every route would land twice

## A minimal example

A custom router that wraps `LinearRouter` and counts lookups:

```typescript
import { App, LinearRouter, defineCoreHandler } from 'routup';
import type { IRouter, Route, RouteMatch, RouteEntry } from 'routup';

class CountingRouter implements IRouter<RouteEntry> {
    private inner = new LinearRouter<RouteEntry>();
    public lookups = 0;

    add(route: Route<RouteEntry>): void {
        this.inner.add(route);
    }

    lookup(path: string): readonly RouteMatch<RouteEntry>[] {
        this.lookups += 1;
        return this.inner.lookup(path);
    }

    get routes() {
        return this.inner.routes;
    }

    clone(): IRouter<RouteEntry> {
        return new CountingRouter();
    }
}

const router = new CountingRouter();
const app = new App({ router });
app.get('/ping', defineCoreHandler(() => 'pong'));

await app.fetch(new Request('http://localhost/ping'));
console.log(router.lookups); // 1
```

## Using `IRouter<T>` outside `App`

Because the router is generic, you can use the built-in routers for any path-keyed lookup — no `App` required:

```typescript
import { TrieRouter } from 'routup';
import type { IRouter } from 'routup';

type Config = { handler: string; cache: boolean };

const table: IRouter<Config> = new TrieRouter<Config>();

table.add({
    path: '/users/:id',
    method: 'GET',
    data: { handler: 'users.show', cache: true },
});

const [match] = table.lookup('/users/42');
console.log(match.route.data.handler); // 'users.show'
console.log(match.params);              // { id: '42' }
```

## Recommended helpers

`routup` exposes one helper that custom routers commonly want — `buildRoutePathMatcher(route)` — which returns a `path-to-regexp`-backed `IPathMatcher` honoring the exact-vs-prefix convention. It returns `undefined` when the route has no path (middleware that matches every request).

```typescript
import { buildRoutePathMatcher } from 'routup';

const matcher = buildRoutePathMatcher(route);
if (matcher) {
    const result = matcher.exec(requestPath);
    if (result) {
        // result.params, result.path
    }
}
```

Use it directly when you want stock path semantics; bypass it when you're building a radix tree, an aggregated regex, or another structure-specific mechanism.
