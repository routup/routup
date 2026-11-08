# Conventions

## Code Style

- **Language**: TypeScript (strict mode, ES2022 target)
- **Linting**: ESLint with `@tada5hi/eslint-config`
- **Indentation**: 4 spaces (configured via `.editorconfig`)
- **Line endings**: LF
- **Charset**: UTF-8

```bash
npm run lint       # Check
npm run lint:fix   # Auto-fix
```

`eslint.config.js` adds one rule override: `@typescript-eslint/no-unused-vars` ignores names starting with `_`.

## Commit Conventions

**Conventional Commits**, configured in `commitlint.config.mjs` (`@tada5hi/commitlint-config`).

Format: `type(scope): message`

| Type | Use for |
|------|---------|
| `feat` | New features |
| `fix` | Bug fixes |
| `docs` | Documentation only |
| `refactor` | Code changes that neither fix nor add features |
| `test` | Adding or updating tests |
| `chore` | Maintenance, deps, config |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration |

## Helper Naming Convention

All helpers are standalone, tree-shakeable functions that take `event: IAppEvent` as the first argument. The function name prefix indicates its behavior:

| Prefix | Meaning | Caches? | Async? | Example |
|--------|---------|---------|--------|---------|
| `get*` | Pure read, no side effects | No | No | `getRequestIP`, `getRequestHeader` |
| `set*` | Mutate event state (headers, status) | No | No | `setResponseCacheHeaders`, `setResponseHeaderAttachment` |
| `send*` | Build and return a `Response` | No | No | `sendRedirect`, `sendStream`, `sendFormat` |
| `read*` | Async I/O read, cached in `event.store` | Yes | Yes | — |
| `use*` | Create an object, cached in `event.store` | Yes | No | `useRequestNegotiator` |
| `is*` | Boolean check | No | No | `isRequestCacheable` |
| `match*` | Pattern match check | No | No | `matchRequestContentType` |
| `append*` | Add to existing value | No | No | `appendResponseHeader`, `appendResponseHeaderDirective` |
| `create*` | Factory, returns a new object | No | No | `createEventStream` |

## Build System

- **Bundler**: tsdown (powered by rolldown)
- **Output**: ESM-only with TypeScript declarations
- **Config**: `tsdown.config.ts`

```bash
npm run build          # Full build (JS + type-check)
npm run build:js       # tsdown bundle only
npm run build:types    # tsc --noEmit (type-check only)
```

## CI/CD

**GitHub Actions** with three workflows:

### Main CI (`.github/workflows/main.yml`)
- **Triggers**: Push to `develop`, `master`, `next`, `beta`, `alpha`; PRs to the same branches
- **Jobs**: Install → Build → Lint + Tests (parallel) → Coverage (master only, uploaded to Codecov)

### Release (`.github/workflows/release.yml`)
- **Triggers**: Push to `master`
- **Tool**: Google Release-Please
- **Process**: Analyzes conventional commits → creates release PR with version bump + CHANGELOG → on merge, creates the GitHub release
- **Config**: `release-please-config.json`, `.release-please-manifest.json`

### Docs (`.github/workflows/docs.yml`)
- **Triggers**: Push to `master` touching `docs/**`
- **Process**: Deploys the VitePress site

## Branching

| Branch | Purpose |
|--------|---------|
| `master` | Default branch: PR target, triggers releases |
| `next`, `beta`, `alpha` | Pre-release channels in the CI triggers |
| `develop` | In the CI triggers only; inactive |

## Design Conventions

- **Type checks**: Use `isObject()` from `src/utils/` instead of `typeof x === 'object'` for object checks
- **Tree-shakeable helpers**: Request/response operations are standalone functions, not object methods
- **Factory pattern**: `defineCoreHandler()` and `defineErrorHandler()` factories for type-safe handler creation
- **Dual syntax**: Handlers support both shorthand (function) and verbose (config object) forms
- **Runtime agnostic**: Core code avoids Node.js-specific APIs; adapters bridge to specific runtimes

## References
External project references live in .agents/references/. When looking up source code in a referenced project (e.g., tsoa), always update the corresponding reference file with:

The source file path / function name in the external project
The corresponding local file path / function name
Any behavioral differences between the implementations
This builds a cumulative mapping over time so future work can quickly find corresponding code without re-searching.
