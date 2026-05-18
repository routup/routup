# Plugin Authoring

A routup **plugin** is a plain object with a `name` and an `install(router)` function. When you call `app.use(plugin)`, routup spins up a dedicated child router named after the plugin, hands it to `install()`, and mounts it on the parent. That single indirection is what lets plugins layer middleware, register routes, attach hooks, and namespace state without colliding with anything the host app does.

## When to write a plugin (vs. a helper module)

| Write a plugin when… | Write a tree-shakeable helper module when… |
|---|---|
| You need to register middleware on a router | You only export pure functions like `getRequestHeader(event, name)` |
| You want a reusable name + version contract | The host app already mounts whatever middleware your helpers depend on |
| You want opt-in install-time uniqueness via `singleton` or `singletonByPath` so repeat installs become silent no-ops | You're happy with `event.store` being whatever the host put there |

Most published plugins ship **both**: a plugin factory (`cookie()`, `body()`, `decorators()`) plus tree-shakeable helpers (`useRequestCookie`, `readRequestBody`). The factory installs the parser middleware once; the helpers read from the cached state.

## The Plugin interface

```typescript
import type { Plugin } from 'routup';

export type Plugin = {
    name: string;
    version?: string;
    singleton?: boolean;
    singletonByPath?: boolean;
    install: (router: App) => any;
};
```

| Field | Required? | Purpose |
|---|---|---|
| `name` | yes | Used by `app.hasPlugin(name)` and error messages. Convention: a short bare name matching the plugin's purpose (`'cookie'`, `'body'`, `'decorators'`) — not the npm package name. |
| `version` | recommended | A semver string surfaced via `app.getPluginVersion(name)`. Mirror the package's `version`. |
| `singleton` | optional | When `true`, a second install of the same name (at any path) is **silently skipped**, and the first successful `singleton: true` install records a sticky claim — every later install of that name no-ops too. Use for cross-cutting concerns (CORS, body parser, auth) where multiple instances would be a bug. Default `false`. |
| `singletonByPath` | optional | When `true`, a second install of the same name at the same canonical mount path is silently skipped; installs at other paths still proceed. Cheaper than full `singleton` when you only need per-mount idempotency. Default `false`. |
| `install(router)` | yes | Receives a child router that's already named after the plugin. Mount middleware, register routes, attach hooks. Return value is ignored. |

By default — neither `singleton` nor `singletonByPath` set — `app.use(plugin)` is permissive: the same plugin can be re-installed at any mount path (including the same path), and each install runs `install()` again. Most published plugins set `singleton: true` or `singletonByPath: true` so accidental double-installs don't double-register middleware.

## A minimal plugin

The smallest useful plugin: a request-id middleware that reads or generates a request id and exposes it via `event.store`.

```typescript
// src/index.ts
import {
    type IAppEvent,
    type Plugin,
    App,
    defineCoreHandler,
} from 'routup';
import { version } from '../package.json' with { type: 'json' };

const STORE_KEY = Symbol.for('@example/request-id');

export function requestId(): Plugin {
    return {
        name: 'request-id',
        version,
        install(router: App) {
            router.use(defineCoreHandler((event) => {
                const id = event.headers.get('x-request-id') ?? crypto.randomUUID();
                event.store[STORE_KEY] = id;
                event.response.headers.set('x-request-id', id);
                return event.next();
            }));
        },
    };
}

export function useRequestId(event: IAppEvent): string | undefined {
    return event.store[STORE_KEY] as string | undefined;
}
```

```typescript
// app.ts
import { App, serve } from 'routup';
import { requestId, useRequestId } from '@example/request-id';

const app = new App();
app.use(requestId());
app.get('/', (event) => ({ id: useRequestId(event) }));
serve(app, { port: 3000 });
```

The factory pattern (`requestId()` returning a `Plugin`) is the convention every shipped plugin follows — it lets users pass options without losing the `Plugin` shape.

## Mounting under a path

`app.use(path, plugin)` mounts the plugin's child router under that prefix:

```typescript
app.use('/admin', requireAuth());
// requireAuth's middleware only runs for /admin/*
```

Inside `install()`, the plugin doesn't need to know — it operates on its child router as if it owned the world. The parent decides the namespace.

A plugin can be installed at several mount paths on the same app — `@routup/assets` mounted at both `/v1` and `/v2`, for example. Each mount lives independently in the route table:

```typescript
app.use('/v1', assets({ dir: 'static-v1' }));
app.use('/v2', assets({ dir: 'static-v2' })); // independent mount
```

If a plugin only wants to be idempotent at a specific path (a second install at the same path is a setup bug, but different paths are fine), set `singletonByPath: true` on the plugin object — subsequent installs at the same canonical path silently no-op. For "install at most once anywhere" semantics (CORS, body parser, auth), set `singleton: true` — every later install of the name is silently skipped, including ones via mounted children.

## Reading installed plugins

Plugins (and the host app) can introspect what's already on a router:

```typescript
app.hasPlugin('body');                                // boolean — any mount
app.hasPluginAt('assets', '/v1');                     // boolean — specific mount
app.getPluginVersion('body');                         // string | undefined — any mount
app.getPluginVersionAt('assets', '/v1');              // string | undefined — specific mount
app.getPluginMountPaths('assets');                    // readonly string[] — every mount path
```

`hasPlugin` / `getPluginVersion` work at the "any-mount" granularity that most callers want; the `*At` variants and `getPluginMountPaths` are there when you need to ask about a specific mount. `path` arguments are interpreted the same way as `app.use(path, plugin)` — relative to the app, normalized with the app's own `path` prefix.

Lookup is local to the router. Plugins installed on a mounted child are merged into the parent at mount time, so the parent's `hasPlugin` reflects them.

This is what helpers like `readRequestBody(event)` use under the hood: they look up the body plugin's installed version via `event.appOptions` and throw `PluginNotInstalledError` if absent.

## See also

- [Conventions](./conventions) — helper naming, store keys, package shape
