# Migrating to v6

Routup v6 renames the top-level class and the route-table abstraction to align with ecosystem conventions (rou3, Hono, Gin: "router" means the route table; the application class has its own name). It also consolidates path matching into a single place — the resolver (now called router) — and ships a pluggable router family.

The runtime behaviour, hook lifecycle, and helper APIs are largely unchanged. Most app code only needs identifier renames.

## Quick summary

| v5 | v6 |
|----|-----|
| `new Router()` | `new App()` |
| `IRouter` (top-level interface) | `IApp` |
| `RouterOptions` / `RouterOptionsInput` | `AppOptions` / `AppOptionsInput` |
| `RoutupEvent` / `IRoutupEvent` | `AppEvent` / `IAppEvent` |
| `RoutupError` | `AppError` |
| `RoutupRequest` | `AppRequest` |
| `LinearRouteResolver` / `TrieRouteResolver` / `MemoizedRouteResolver` | `LinearRouter` / `TrieRouter` / `MemoizedRouter` |
| `IRouteResolver` (resolver interface) | `IRouter` |
| `ResolverMatch` | `RouterMatch` |
| `RouterOptionsInput.resolver` | `AppOptionsInput.router` |
| `Handler.matchPath()` / `Router.matchPath()` | _removed_ — path matching now lives only in the resolver |
| `RouterOptions.path` (runtime path-strip) | `AppOptions.path` (registration-time **prefix**) |
| `event.routerPath` / `event.routerOptions` | `event.appPath` / `event.appOptions` |
| `RouterPipelineStep` / `RouterPipelineContext` / `RouterStackEntryType` / `RouterPathNode` / `RouterSymbol` | `App*` equivalents |
| `RouterStackEntryType.ROUTER` (enum value) | `AppStackEntryType.APP` |
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

## Pluggable router family

The route table is now a first-class abstraction with multiple implementations:

```typescript
import { App, LinearRouter, TrieRouter, MemoizedRouter } from 'routup';

// Default — walks entries linearly per request. Best for small route counts.
new App({ router: new LinearRouter() });

// Radix-trie matching with a static-path fast path. Worth swapping in
// when route count grows past ~30.
new App({ router: new TrieRouter() });

// Wraps any router in a per-path lookup cache. Useful when the underlying
// router's lookup is non-trivial and the workload sees repeated paths.
new App({ router: new MemoizedRouter(new LinearRouter()) });
```

Custom routers implement `IRouter`:

```typescript
import type { IRouter, RouterMatch } from 'routup';

class MyRouter implements IRouter {
    add(entry) { /* ... */ }
    lookup(path: string): readonly RouterMatch[] { /* ... */ }
    get entries() { /* ... */ }
}
```

## `AppOptions.path` — semantic change

`Router.options.path` previously stripped its prefix from `event.path` at runtime inside `Router.dispatch`. In v6 it is a **registration-time prefix** — the value is prepended to every entry registered via `use`/`get`/etc. through `joinPaths`.

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

## `event.routerPath` / `event.routerOptions` renamed

Internal event fields renamed to match the App-family naming:

```typescript
// v5
event.routerPath;     // path of the dispatching router stack
event.routerOptions;  // resolved router options

// v6
event.appPath;        // same data, new name
event.appOptions;
```

## Hook names unchanged from v5.x

`HookName.START` / `END` / `ERROR` / `CHILD_*` are unchanged — they were renamed in v5.1. v6 doesn't touch this surface.

## Why these renames?

The `Router` ↔ `IRouteResolver` split in v5 worked but used names that conflicted with how the rest of the ecosystem (rou3, Hono, Gin, h3) uses "router." In every other framework, "router" means **the route table** — what routup called `IRouteResolver`. Routup's `Router` was actually a *dispatch engine* wrapping a router, hooks, plugins, and a pipeline.

v6 fixes this:
- `App` (was `Router`) — the dispatch engine; matches Hono's `Hono` / h3's `App` convention.
- `IRouter` (was `IRouteResolver`) — the route table; matches every other framework.
- `LinearRouter` / `TrieRouter` / `MemoizedRouter` — the route-table implementations; recognizable on import.

The `App*` brand on `AppError` / `AppEvent` / `AppRequest` preserves collision-safety against globals (`Error`, `Event`, `Request`) without the longer `Routup*` prefix.

## Performance notes

- `Handler.dispatch`'s await chain was collapsed for sync-handler + no-timeout common path — measured ~5% req/s improvement under autocannon. No code change required to opt in.
- `TrieRouter` (the new radix-trie router) ships with a static-path fast-path map; consider swapping it in for apps with many static routes.
- The full performance arc and remaining levers are tracked in [`.agents/plans/010-trie-roadmap.md`](https://github.com/routup/routup/blob/master/.agents/plans/010-trie-roadmap.md) and [`012-hot-path-slim-down.md`](https://github.com/routup/routup/blob/master/.agents/plans/012-hot-path-slim-down.md).
