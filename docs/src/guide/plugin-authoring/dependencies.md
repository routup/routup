# Plugin Dependencies

Plugins often build on top of each other — `decorators` needs body/cookie/query parsing, `swagger` reads metadata produced by `decorators`, custom auth plugins layer on cookies. The `dependencies` field is how a plugin says *"these must be installed before me"*, with optional version constraints.

## The shape

```typescript
type PluginDependency = {
    name: string;
    version?: string;   // semver constraint
    optional?: boolean; // skip silently if absent
};

type Plugin = {
    // ...
    dependencies?: (string | PluginDependency)[];
};
```

A bare string is shorthand for `{ name: string }` — name-only, any version, required.

## A required dependency

```typescript
import type { Plugin, Router } from 'routup';

export function decorators(options: DecoratorsOptions): Plugin {
    return {
        name: 'decorators',
        version,
        dependencies: ['body', 'cookie', 'query'],
        install(router: Router) {
            // mount controllers, register routes
        },
    };
}
```

If the host app calls `router.use(decorators(...))` without first installing `body`, `cookie`, and `query`, routup throws `PluginDependencyError` *at install time* — not at first request — so the failure surfaces in the boot path.

## Constraining the version

For dependencies that have moved through breaking changes, pin a semver constraint:

```typescript
dependencies: [
    { name: 'basic', version: '^4.0.0' },
],
```

Routup ships `satisfiesVersion()` for the same matching used internally — handy when a plugin needs to branch on the version of one of its deps:

```typescript
import { satisfiesVersion } from 'routup';

const installedVersion = router.getPluginVersion('basic')!;
if (satisfiesVersion(installedVersion, '>=5.0.0')) {
    // use the new API
}
```

### Supported constraint formats

| Form | Meaning |
|---|---|
| `'1.2.3'` or `'=1.2.3'` | Exact match |
| `'>1.2.3'` / `'>=1.2.3'` / `'<1.2.3'` / `'<=1.2.3'` | Comparison |
| `'^1.2.3'` | `>=1.2.3 <2.0.0` (compatible-major) |
| `'~1.2.3'` | `>=1.2.3 <1.3.0` (compatible-minor) |
| `'>=1.0.0 <2.0.0'` | Whitespace-separated ranges (all must match) |

Prereleases follow npm semantics: a prerelease only matches if it shares the exact `[major, minor, patch]` of the lower bound (so `1.0.0-beta.1` satisfies `^1.0.0-beta.0` but not `^0.9.0`).

## Optional dependencies

Some plugins extend their behaviour when another plugin is present, but work fine without it:

```typescript
dependencies: [
    { name: 'cookie', optional: true },
],
install(router) {
    if (router.hasPlugin('cookie')) {
        // wire the cookie-aware code path
    } else {
        // fall back to header-based behaviour
    }
}
```

`optional: true` skips the not-installed error but still validates the version constraint *if* the dependency happens to be present.

## The four error types

Plugin lifecycle errors all extend `PluginError`. Catch the specific subclass when you need to distinguish:

| Error | When it's thrown | Useful properties |
|---|---|---|
| `PluginAlreadyInstalledError` | Same plugin name installed twice on one router | `pluginName` |
| `PluginDependencyError` | A required dependency is missing or version-incompatible | `pluginName`, `dependencyName` |
| `PluginInstallError` | The plugin's `install()` function threw — wraps the original cause | `pluginName`, `cause` |
| `PluginNotInstalledError` | A helper called against a router whose plugin isn't installed | `pluginName`, `helperName` |

```typescript
import { PluginNotInstalledError } from 'routup';

export function useRequestCookie(event: IRoutupEvent, name: string) {
    if (!event.routerOptions.plugins?.has('cookie')) {
        throw new PluginNotInstalledError('cookie', 'useRequestCookie');
    }
    // ...
}
```

The not-installed error is the convention for tree-shakeable helpers — fail loudly with a hint instead of returning `undefined` and confusing the caller.

## Installation order

Routup validates dependencies at the moment of `router.use(plugin)`. That means **dependencies must be installed first** — there's no deferred resolution:

```typescript
router.use(basic());           // installs first
router.use(decorators({...})); // declares body/cookie/query as dependencies, validates here
```

Installing them in the reverse order throws `PluginDependencyError` immediately. There's no "install everything, resolve later" mode by design — the install order is the readable source of truth for dependency direction.

## See also

- [Authoring overview](./) — the Plugin interface and a minimal example
- [Conventions](./conventions) — naming, packaging, and helper patterns
