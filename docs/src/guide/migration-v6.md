# Migrating to v6

Routup v6 renames the top-level class and the route-table abstraction to align with ecosystem conventions (rou3, Hono, Gin: "router" means the route table; the application class has its own name). It also consolidates path matching into a single place — the resolver (now called router) — and ships a pluggable router family with an opt-in lookup cache.

Routup v6 also removes the lifecycle-hook surface (`app.on(...)`, `HookName`, per-handler `onBefore`/`onAfter`/`onError`) and flattens mounted sub-apps into the parent's router at `use(...)` time. Most app code only needs identifier renames; the hook and sub-app changes are covered in dedicated sections below.

## Quick summary

| v5 | v6 |
|----|-----|
| `new Router()` | `new App()` |
| `IRouter` (top-level interface) | `IApp` |
| `RouterOptions` / `RouterOptionsInput` | `AppOptions` / `AppOptionsInput`; the `App` constructor takes `AppContext` (`{ name, path, options, plugins, router }`) |
| `app.on(...)` / `app.off(...)`, `HookName.*` | _removed_ — express lifecycle wrapping as middleware (see [Middleware Patterns](./middleware-patterns) and the "Hooks removed" section below) |
| `HandlerOptions.onBefore` / `onAfter` / `onError` | _removed_ — wrap the handler in a middleware that calls `event.next()` |
| `RouteEntry` / `AppRouteEntry` / `HandlerRouteEntry` / `RouteEntryType` | _removed_ — `App` now stores routes as `Route<Handler>` directly; with sub-apps flattened at mount time there is no `APP` discriminator |
| `RoutupEvent` / `IRoutupEvent` | `AppEvent` / `IAppEvent` |
| `RoutupError` | `AppError` |
| `RoutupRequest` | `AppRequest` |
| `LinearRouteResolver` / `TrieRouteResolver` | `LinearRouter` / `TrieRouter` (the resolver hierarchy collapses to two leaf routers; lookup caching is now an opt-in `cache` option on each — see [Custom Cache](./custom-cache)) |
| `IRouteResolver` (resolver interface) | `IRouter` |
| `ResolverMatch` | `RouteMatch` |
| `RouterOptionsInput.resolver` | `AppContext.router` |
| `Handler.matchPath()` / `Router.matchPath()` | _removed_ — path matching now lives only in the resolver |
| `RouterOptions.path` (runtime path-strip) | `AppContext.path` (registration-time **prefix**) |
| `event.routerPath` | _removed_ — option resolution moved to mount time; the per-request stack walk is gone |
| `event.routerOptions` | `event.appOptions` |
| `RouterPipelineStep` / `RouterPipelineContext` / `RouterStackEntryType` / `RouterSymbol` | `AppPipelineStep` / `AppPipelineContext` / `RouteEntryType` / `AppSymbol` |
| `RouterStackEntryType.ROUTER` (enum value) | `RouteEntryType.APP` |
| `Router.StackEntry` | `RouteEntry` (`AppRouteEntry` \| `HandlerRouteEntry`) |
| `isRouterInstance()` | `isAppInstance()` |

## Renames at a glance

```typescript
// v5
import { Router, defineCoreHandler, serve, type IRoutupEvent } from 'routup';

const router = new Router();
router.get('/users', defineCoreHandler((event: IRoutupEvent) => 'ok'));

serve(router);

// v6
import { App, defineCoreHandler, serve, type IAppEvent } from 'routup';

const app = new App();
app.get('/users', defineCoreHandler((event: IAppEvent) => 'ok'));

serve(app);
```

## Tighter typing on `event.method` and `event.params`

Both fields became more specific in v6 without any runtime change. The point is to surface bugs at compile time that previously type-checked silently as `any` / `string`.

- `event.method` was `string`, now `MethodNameLike` — the canonical `MethodName` union (`'GET' | 'POST' | …`) intersected with a `(string & {})` open-enum escape hatch. Standard verbs autocomplete; non-standard verbs (`PROPFIND`, custom) still type-check.
- `event.params` was `Record<string, any>`, now `Record<string, string | undefined>`. Both routers only ever produce string values; the `undefined` accommodates optional params (`/users/:id?`) that did not match.

```typescript
// v5 — params.id was any, this compiled even if id was missing
defineCoreHandler((event) => event.params.id.toUpperCase());

// v6 — caught at compile time when the route allows optional params
defineCoreHandler((event) => event.params.id!.toUpperCase()); // ! when route guarantees the param
defineCoreHandler((event) => event.params.id?.toUpperCase()); // ? when it may be absent
```

The same narrowing applies to `IDispatcherEvent.method` / `params`, `AppEventCreateContext.method` / `params`, `RouteMatch.params`, and the trie helpers `extractTrieParams` / `assignParams`.

## Sub-apps are flattened at mount time

`parent.use(path, child)` no longer wires `child` in as a runtime sub-dispatcher. Instead it **snapshots `child.routes` at the call**, prepends `path` onto each route, and registers them on the parent's router. The child app is consumed; later mutations on it do not propagate.

```typescript
const child = new App();
child.get('/early', defineCoreHandler(() => 'early'));

const parent = new App();
parent.use('/api', child);

// AFTER the parent.use call — does NOT appear on the parent.
child.get('/late', defineCoreHandler(() => 'late'));

await parent.fetch(new Request('http://x/api/early')); // 200
await parent.fetch(new Request('http://x/api/late'));  // 404
```

Mirrors Hono's `app.route(...)` semantics. The benefit is that the dispatcher walks one flat router at request time — no recursive descent into nested apps, no per-mount path-strip step.

A few consequences worth knowing:

- **Plugin registries merge into the parent.** After `parent.use(child)`, `parent.hasPlugin(name)` reflects everything installed on `child` (or any app mounted into `child` earlier). Duplicate plugin names across the merge throw `PluginAlreadyInstalledError`.
- **Per-child app options are discarded.** Every flattened handler runs under the parent's `event.appOptions`. If you need a per-handler timeout, set it on the handler (`defineCoreHandler({ timeout: 1000, fn })`).
- **`event.mountPath` is no longer accumulated across nested-app dispatch.** Instead the dispatcher sets it per matched handler to the prefix the active route consumed (`match.path`), and restores the previous value when the handler returns. Mount-aware helpers (e.g. `@routup/assets`, `@routup/swagger-ui`) keep working — they read the mount prefix off `event.mountPath` exactly as before, just without the per-request stack walk.

## Hooks removed — middleware is the single composition primitive

`app.on(...)` / `app.off(...)` and the `HookName` constants (`START`, `END`, `ERROR`, `CHILD_MATCH`, `CHILD_DISPATCH_BEFORE`, `CHILD_DISPATCH_AFTER`) are gone. So are the per-handler `onBefore` / `onAfter` / `onError` options on `HandlerOptions`. Every v5 hook expressible as middleware (and they all are):

```typescript
// v5
app.on('start', (event) => console.log(event.method, event.path));
app.on('error', (event) => Sentry.captureException(event.error));

// v6
app.use(defineCoreHandler((event) => {
    console.log(event.method, event.path);
    return event.next();
}));
app.use(defineErrorHandler((error) => {
    Sentry.captureException(error);
    throw error; // let downstream error handlers shape the response
}));
```

See the [Middleware Patterns guide](./middleware-patterns) for the full set of equivalents (request logging, error observability, conditional short-circuit, path-scoped instrumentation).

One behavioural difference to know: a v5 hook was a side-effect outside the onion — a buggy listener couldn't deadlock the request. Middleware is **in** the onion. A middleware that returns `undefined` *and* never calls `event.next()` (or produces a response) hangs the request until a timeout aborts it, by design — see the `undefined` contract in the [Architecture guide](./app#returning-undefined). Forgetting the leading `return` on `event.next()` is harmless: the captured downstream result is forwarded automatically when the handler returns `undefined`.

## Note for plugin authors

If a plugin previously accepted `IRouter` as its mount target (the v5 dispatcher interface), update the parameter type to `IApp`. The name `IRouter` is reused in v6 for the route-table abstraction — keeping the v5 annotation will silently change the contract.

```typescript
// v5
export function mountController(router: IRouter, controller: ClassType) { /* … */ }

// v6
export function mountController(app: IApp, controller: ClassType) { /* … */ }
```

Helper functions that take an event (`(event: IRoutupEvent) => …`) just need the `IRoutupEvent` → `IAppEvent` rename.

## Pluggable router family

The route table is now a first-class abstraction with multiple implementations:

```typescript
import { App, LinearRouter, TrieRouter, LruCache } from 'routup';

// Default — walks entries linearly per request. Best for small route counts.
new App({ router: new LinearRouter() });

// Radix-trie matching with a static-path fast path. Worth swapping in
// when route count grows past ~30.
new App({ router: new TrieRouter() });

// Either router accepts an opt-in lookup cache via `BaseRouterOptions.cache`.
// Default is no cache; pass an `LruCache` (or your own `ICache`) to enable
// per-path memoization. See the Custom Cache guide for details.
new App({ router: new TrieRouter({ cache: new LruCache() }) });
```

Custom routers implement `IRouter`:

```typescript
import type { IRouter, Route, RouteMatch } from 'routup';

class MyRouter implements IRouter {
    add(route: Route) { /* ... */ }
    lookup(path: string): readonly RouteMatch[] { /* ... */ }
    get routes(): readonly Route[] { /* ... */ }
    clone(): IRouter { /* ... */ }
}
```

See the [Custom Router guide](./custom-router) for the full contract and a working example.

## `AppContext.path` — semantic change

`Router.options.path` previously stripped its prefix from `event.path` at runtime inside `Router.dispatch`. In v6 it is a **registration-time prefix** — the value is prepended to every entry registered via `use`/`get`/etc. through `joinPaths`. It now lives at the top level of the App constructor input (`new App({ path: '/api' })`), separated from runtime options that propagate to mounted children.

```typescript
// v5 — runtime path-strip; handlers saw `event.path === '/users'` for
// request `/api/users`.
const router = new Router({ path: '/api' });
router.get('/users', defineCoreHandler((event) => event.path));
// v5: '/users'
// v6: '/api/users'   ← path is no longer stripped before reaching the handler
```

Routes still match identically. Handlers that branch on `event.path` (uncommon — usually `event.params` is used) need to account for the un-stripped value.

## `Handler.matchPath()` and `Router.matchPath()` removed

Path matching is no longer performed inside `Handler.dispatch` or `Router.dispatch`. The active `IRouter` (the route table) is the single source of truth for "does this entry match?". This removes a long-standing duplication where a handler with an intrinsic `path` had its own matcher in addition to the resolver's.

A side effect: a handler with both an intrinsic `path` and a mount path now has them **combined** into a single matched path. Previously the intrinsic path was silently overridden by the mount path on `router.use(mountPath, handler)`, which was a latent surprise.

```typescript
// v5: handler intrinsic '/list' was silently ignored — the resolver
// matched only on '/users'.
router.get('/users', defineCoreHandler({
    path: '/list',
    fn: () => 'ok',
}));

// v6: paths combine — entry registered as '/users/list'.
app.get('/users', defineCoreHandler({
    path: '/list',
    fn: () => 'ok',
}));
```

## `event.routerPath` removed; `event.routerOptions` renamed

`routerPath` walked the chain of dispatching routers so consumers could resolve options outer→inner per request. v6 resolves options at mount time instead — every App's `_options` is its fully merged view, and dispatch just swaps that onto the event. The per-request walk (and the field) are gone.

`routerOptions` was renamed to `appOptions` in line with the rest of the App-family rename.

```typescript
// v5
event.routerPath;     // path of the dispatching router stack
event.routerOptions;  // resolved router options

// v6
event.appOptions;     // pre-resolved view set by the dispatching App
```

## Why these renames?

The `Router` ↔ `IRouteResolver` split in v5 worked but used names that conflicted with how the rest of the ecosystem (rou3, Hono, Gin, h3) uses "router." In every other framework, "router" means **the route table** — what routup called `IRouteResolver`. Routup's `Router` was actually a *dispatch engine* wrapping a router, plugins, and a pipeline.

v6 fixes this:
- `App` (was `Router`) — the dispatch engine; matches Hono's `Hono` / h3's `App` convention.
- `IRouter` (was `IRouteResolver`) — the route table; matches every other framework.
- `LinearRouter` / `TrieRouter` — the route-table implementations; recognizable on import. Either accepts an opt-in `cache` option.

The `App*` brand on `AppError` / `AppEvent` / `AppRequest` preserves collision-safety against globals (`Error`, `Event`, `Request`) without the longer `Routup*` prefix.

## Performance notes

- `Handler.dispatch`'s await chain was collapsed for sync-handler + no-timeout common path — measured ~5% req/s improvement under autocannon. No code change required to opt in.
- `TrieRouter` (the new radix-trie router) ships with a static-path fast-path map; consider swapping it in for apps with many static routes.
- The full performance arc and remaining levers are tracked in [`.agents/plans/010-trie-roadmap.md`](https://github.com/routup/routup/blob/master/.agents/plans/010-trie-roadmap.md) and [`012-hot-path-slim-down.md`](https://github.com/routup/routup/blob/master/.agents/plans/012-hot-path-slim-down.md).
