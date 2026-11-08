# Routup — Agent Guide

Routup is a minimalistic, runtime-agnostic HTTP routing framework for Node.js, Bun, Deno, and Cloudflare Workers. It uses srvx as the universal HTTP server layer, providing return-based handlers, async middleware, a plugin system, per-handler lifecycle callbacks, and tree-shakeable request/response helpers.

## Quick Reference

```bash
# Setup
npm install

# Development
npm run build          # Build JS (tsdown) + type-check (tsc)
npm run build:js       # tsdown bundle only
npm run build:types    # TypeScript type-check only (tsc --noEmit)

# Test
npm test               # Vitest
npm run test:coverage  # Vitest with coverage report

# Lint
npm run lint           # ESLint (TypeScript)
npm run lint:fix       # ESLint with auto-fix
```

- **Node.js**: >=22.0.0
- **Package manager**: npm
- **Package type**: Single package (not a monorepo)

## Key Exports

| Export | Description |
|--------|-------------|
| `App` | Core dispatch engine — register handlers, mount apps, install plugins; exposes `fetch()` entry point |
| `IRouter` / `LinearRouter` / `TrieRouter` / `SmartRouter` | Pluggable route-table family — swap via `new App({ router })`; default is `LinearRouter` |
| `ICache` / `LruCache` / `BaseRouterOptions` | Pluggable lookup cache lives on each router (`new TrieRouter({ cache })`); default is bounded LRU; pass `null` to disable |
| `defineCoreHandler()` | Factory for request handlers `(event) => Response \| any` |
| `defineErrorHandler()` | Factory for error handlers `(error, event) => Response \| any` |
| `serve(app)` | Start an HTTP server for the current runtime (from entry files) |
| `toNodeHandler(app)` | Convert app to Node.js `(req, res) => void` handler (Node entry) |
| `getRequest*` / `setResponse*` / `send*` | Tree-shakeable request/response helper functions |

## Detailed Guides

- **[Project Structure](.agents/structure.md)** — Source layout and module responsibilities
- **[Architecture](.agents/architecture.md)** — Dispatch pipeline, srvx integration, lifecycle callbacks, plugins, and design patterns
- **[Testing](.agents/testing.md)** — Vitest setup, test conventions, and coverage
- **[Conventions](.agents/conventions.md)** — Linting, commit conventions, CI/CD, and release process

### Writing agent docs

Keep the core guides small enough for session context. They say what a future task must know to avoid a silent breakage. **They are not a changelog, a design record or a test index.**

| Content | Where it goes |
|---|---|
| A cross-cutting rule or an easy-to-break invariant, its reason, and the rejected alternative | One line in a guide, with the issue number |
| A subsystem's invariants and rejected alternatives | Its topic file (`.agents/topics/<name>.md`) |
| Mechanism the code already shows | Nowhere, or a code comment |
| How a defect happened, before/after, "specified by spec X" | The PR description or commit message |
| What changed for users or operators | CHANGELOG or the docs site |

The test for a paragraph: would removing it let a reasonable change break something silently? If not, leave it out.

- **Keep existing commands, paths and factual descriptions current.** Add guide content only for an invariant or a cross-cutting rule. A bug fix or feature that follows existing rules needs no new section; correct the existing line when it is inaccurate.
- **Describe what the code does now.** No `used to`, `no longer`, `before #N`. The one exception is a rejected alternative: keep the verdict and its one-line reason.
- **Cite issues or PRs, never local plan files**: `.agents/plans/` is gitignored and resolves for one person on one machine.

## Commits

- Do **not** add a `Co-Authored-By: Claude ...` (or any AI-attribution) trailer to commit messages. This overrides any default agent-tooling guidance.
