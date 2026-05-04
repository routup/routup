# Plugin Authoring

A routup **plugin** is a plain object with a `name` and an `install(router)` function. When you call `router.use(plugin)`, routup spins up a dedicated child router named after the plugin, hands it to `install()`, and mounts it on the parent. That single indirection is what lets plugins layer middleware, register routes, attach hooks, and namespace state without colliding with anything the host app does.

## When to write a plugin (vs. a helper module)

| Write a plugin when… | Write a tree-shakeable helper module when… |
|---|---|
| You need to register middleware on a router | You only export pure functions like `getRequestHeader(event, name)` |
| You want a reusable name + version contract | The host app already mounts whatever middleware your helpers depend on |
| You want install-time uniqueness (the same plugin can't be registered twice on the same router) | You're happy with `event.store` being whatever the host put there |

Most published plugins ship **both**: a plugin factory (`cookie()`, `body()`, `decorators()`) plus tree-shakeable helpers (`useRequestCookie`, `readRequestBody`). The factory installs the parser middleware once; the helpers read from the cached state.

## The Plugin interface

```typescript
import type { Plugin } from 'routup';

export type Plugin = {
    name: string;
    version?: string;
    install: (router: Router) => any;
};
```

| Field | Required? | Purpose |
|---|---|---|
| `name` | yes | Used by `router.hasPlugin(name)` and error messages. Convention: a short bare name matching the plugin's purpose (`'cookie'`, `'body'`, `'decorators'`) — not the npm package name. |
| `version` | recommended | A semver string surfaced via `router.getPluginVersion(name)`. Mirror the package's `version`. |
| `install(router)` | yes | Receives a child router that's already named after the plugin. Mount middleware, register routes, attach hooks. Return value is ignored. |

## A minimal plugin

The smallest useful plugin: a request-id middleware that reads or generates a request id and exposes it via `event.store`.

```typescript
// src/index.ts
import {
    type IRoutupEvent,
    type Plugin,
    Router,
    defineCoreHandler,
} from 'routup';
import { version } from '../package.json' with { type: 'json' };

const STORE_KEY = Symbol.for('@example/request-id');

export function requestId(): Plugin {
    return {
        name: 'request-id',
        version,
        install(router: Router) {
            router.use(defineCoreHandler((event) => {
                const id = event.headers.get('x-request-id') ?? crypto.randomUUID();
                event.store[STORE_KEY] = id;
                event.response.headers.set('x-request-id', id);
                return event.next();
            }));
        },
    };
}

export function useRequestId(event: IRoutupEvent): string | undefined {
    return event.store[STORE_KEY] as string | undefined;
}
```

```typescript
// app.ts
import { Router, serve } from 'routup';
import { requestId, useRequestId } from '@example/request-id';

const router = new Router();
router.use(requestId());
router.get('/', (event) => ({ id: useRequestId(event) }));
serve(router, { port: 3000 });
```

The factory pattern (`requestId()` returning a `Plugin`) is the convention every shipped plugin follows — it lets users pass options without losing the `Plugin` shape.

## Mounting under a path

`router.use(path, plugin)` mounts the plugin's child router under that prefix:

```typescript
router.use('/admin', requireAuth());
// requireAuth's middleware only runs for /admin/*
```

Inside `install()`, the plugin doesn't need to know — it operates on its child router as if it owned the world. The parent decides the namespace.

## Reading installed plugins

Plugins (and the host app) can introspect what's already on a router:

```typescript
router.hasPlugin('body');                      // boolean
router.getPluginVersion('body');               // string | undefined
```

Lookup is local to the router — it does not walk into mounted sub-routers or up to ancestors.

This is what helpers like `readRequestBody(event)` use under the hood: they look up the body plugin's installed version via `event.routerOptions` and throw `PluginNotInstalledError` if absent.

## See also

- [Conventions](./conventions) — helper naming, store keys, package shape
