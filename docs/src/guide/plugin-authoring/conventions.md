# Plugin Conventions

The shipped routup plugins follow a small set of conventions. Adopting them in your plugin makes it feel native, integrates cleanly with `decorators` parameter extractors, and gives users predictable mental models across the ecosystem.

## Helper naming

Tree-shakeable helpers always take `event` as the first argument. The function-name prefix tells the caller what the helper does and whether it's cached:

| Prefix | Meaning | Caches in `event.store`? | Async? | Examples |
|---|---|---|---|---|
| `get*` | Pure read, no side effects | No | No | `getRequestHeader`, `getRequestIP` |
| `set*` | Mutate event state (headers, status) | No | No | `setResponseCookie`, `setResponseCacheHeaders` |
| `send*` | Build and return a `Response` | No | No | `sendRedirect`, `sendStream` |
| `read*` | Async I/O read | Yes | Yes | `readRequestBody`, `readRequestBodyStream` |
| `use*` | Create / look up a cached object | Yes | No | `useRequestCookies`, `useTranslator` |
| `is*` | Boolean check | No | No | `isRequestCacheable` |
| `match*` | Pattern match check | No | No | `matchRequestContentType` |
| `append*` | Add to existing value | No | No | `appendResponseHeader` |
| `create*` | Factory, returns a new object | No | No | `createEventStream` |

If your plugin caches state per request, `use*` and `read*` are the right prefixes. Reserve `get*` for pure reads that always recompute.

## `event.store` keys

`event.store` is a `Record<string | symbol, unknown>` shared across the whole request. To avoid colliding with other plugins, key your entries with a `Symbol.for()` namespaced to your package:

```typescript
const STORE_KEY = Symbol.for('@example/request-id');

event.store[STORE_KEY] = id;
```

`Symbol.for(name)` returns the same symbol for the same name across module instances, which matters when a plugin is loaded from two paths (workspace + npm cache, or duplicated by a bundler). Plain `Symbol(name)` would create a fresh symbol per import.

Don't expose the key — keep it private to your module and write `use*` helpers that read from it.

## Package shape

A typical plugin's `package.json`:

```json
{
    "name": "@example/request-id",
    "version": "1.0.0",
    "type": "module",
    "exports": {
        "./package.json": "./package.json",
        ".": {
            "types": "./dist/index.d.mts",
            "import": "./dist/index.mjs"
        }
    },
    "types": "./dist/index.d.mts",
    "files": ["dist/"],
    "engines": {
        "node": ">=22.0.0"
    },
    "peerDependencies": {
        "routup": "^5.0.0"
    }
}
```

Conventions worth keeping in lockstep with the rest of the ecosystem:

- **ESM-only**, `"type": "module"`. No CJS dual exports — routup core is ESM-only too.
- **`peerDependencies` for `routup`** so a project can't accidentally pull two versions.
- **`engines.node >= 22`** — routup's baseline.
- **`files: ["dist/"]`** + a build step that emits `dist/index.mjs` + `dist/index.d.mts`.
- Read the version from `package.json` and pass it as the plugin's `version`:

```typescript
import { version } from '../package.json' with { type: 'json' };
```

That keeps `Plugin.version` in sync with the published version automatically.

## The factory pattern

Always export a factory function that *returns* a `Plugin`, not the `Plugin` object directly:

```typescript
// good: factory accepts options
export function cookie(options: CookieOptions = {}): Plugin {
    return {
        name: 'cookie',
        version,
        install(router) { /* ... */ },
    };
}
```

Even when your plugin has no options today, the factory shape lets you add them later without breaking the import surface (`router.use(plugin())` stays the same).

## Failing loudly when a dep helper is called too early

Tree-shakeable helpers shouldn't return undefined just because the plugin isn't installed — that masks the problem far from the cause. Throw `PluginNotInstalledError`:

```typescript
import { PluginNotInstalledError } from 'routup';

export function useRequestCookie(event: IRoutupEvent, name: string): string | undefined {
    if (!event.routerOptions.plugins?.has('cookie')) {
        throw new PluginNotInstalledError('cookie', 'useRequestCookie');
    }
    return readCookieFromStore(event, name);
}
```

The error message tells the caller exactly which `router.use(...)` line they're missing.

## Test skeleton

Plugins are easiest to test by registering them on a fresh `Router` and dispatching real `Request` objects through `router.fetch()`:

```typescript
import { describe, expect, it } from 'vitest';
import { Router, defineCoreHandler } from 'routup';
import { requestId, useRequestId } from '../src';

describe('request-id', () => {
    it('exposes a generated id when no header is set', async () => {
        const router = new Router();
        router.use(requestId());
        router.get('/', defineCoreHandler((event) => useRequestId(event)));

        const response = await router.fetch(new Request('http://localhost/'));
        const id = await response.text();

        expect(id).toMatch(/^[0-9a-f-]{36}$/);
        expect(response.headers.get('x-request-id')).toBe(id);
    });

    it('echoes an incoming x-request-id', async () => {
        const router = new Router();
        router.use(requestId());
        router.get('/', defineCoreHandler((event) => useRequestId(event)));

        const response = await router.fetch(new Request('http://localhost/', {
            headers: { 'x-request-id': 'abc' },
        }));

        expect(await response.text()).toBe('abc');
    });
});
```

No mocks, no test server — `router.fetch(request)` is the entire surface.

## See also

- [Authoring overview](./) — the Plugin interface, factory pattern, mounting
