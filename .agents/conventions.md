# Conventions

## Code Style

- **Language**: TypeScript (strict mode, ES2022 target)
- **Linting**: ESLint with `@tada5hi/eslint-config-typescript`
- **Indentation**: 4 spaces (configured via `.editorconfig`)
- **Line endings**: LF
- **Charset**: UTF-8

```bash
npm run lint       # Check
npm run lint:fix   # Auto-fix
```

Key ESLint overrides (`.eslintrc`):
- `class-methods-use-this`: off
- `no-continue`: off
- `no-shadow`: off (TS version used instead)
- `no-use-before-define`: off
- Dev dependency imports allowed in `test/` files

## Commit Conventions

**Conventional Commits** enforced via commitlint (`@tada5hi/commitlint-config`) and Husky pre-commit hooks.

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

## Build System

- **Bundler**: Rollup with SWC plugin (faster than tsc for compilation)
- **Output**: Dual CJS (`dist/index.cjs`) + ESM (`dist/index.mjs`) + TypeScript declarations (`dist/index.d.ts`)
- **Config**: `rollup.config.mjs`

```bash
npm run build          # Full build (clean + JS + types)
npm run build:js       # Rollup bundle only
npm run build:types    # tsc --emitDeclarationOnly
```

## CI/CD

**GitHub Actions** with two workflows:

### Main CI (`.github/workflows/main.yml`)
- **Triggers**: Push to `develop`, `master`, `next`, `beta`, `alpha`; PRs
- **Jobs**: Install → Build → Lint + Tests (parallel) → Coverage (master only, uploaded to Codecov)
- **Node.js**: 22

### Release (`.github/workflows/release.yml`)
- **Triggers**: Push to `master`
- **Tool**: Google Release-Please v4
- **Process**: Analyzes conventional commits → creates release PR with version bump + CHANGELOG → on merge, creates GitHub release + publishes to NPM via `workspaces-publish`
- **Config**: `release-please-config.json`, `.release-please-manifest.json`

## Branching

| Branch | Purpose |
|--------|---------|
| `develop` | Main development branch (PR target) |
| `master` | Release branch (triggers releases) |
| `next`, `beta`, `alpha` | Pre-release channels |

## Design Conventions

- **Tree-shakeable helpers**: Request/response operations are standalone functions, not object methods
- **Factory pattern**: `defineCoreHandler()` and `defineErrorHandler()` factories for type-safe handler creation
- **Dual syntax**: Handlers support both shorthand (function) and verbose (config object) forms
- **Runtime agnostic**: Core code avoids Node.js-specific APIs; adapters bridge to specific runtimes
