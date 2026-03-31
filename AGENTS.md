<!-- NOTE: Keep this file and all corresponding files in the .agents directory updated as the project evolves. When making architectural changes, adding new patterns, or discovering important conventions, update the relevant sections. -->

# Routup — Agent Guide

Routup is a minimalistic, runtime-agnostic HTTP routing framework for Node.js, Bun, Deno, and Cloudflare Workers. It provides Express-like routing with async/await support, a plugin/hook system, and tree-shakeable request/response helpers.

## Quick Reference

```bash
# Setup
npm install

# Development
npm run build          # Clean dist/, compile with Rollup+SWC, emit .d.ts
npm run build:js       # Rollup bundle only
npm run build:types    # TypeScript declarations only

# Test
npm test               # Jest with SWC transformer
npm run test:coverage  # Jest with coverage report

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
| `Router` | Core routing engine — register handlers, nest routers, define hooks |
| `coreHandler()` | Factory for request handlers `(req, res, next) => ...` |
| `errorHandler()` | Factory for error handlers `(err, req, res, next) => ...` |
| `createNodeDispatcher(router)` | Adapter returning `(req, res) => void` for `http.createServer()` |
| `createWebDispatcher(router)` | Adapter returning `async (request) => Response` for Web API runtimes |
| `useRequest*` / `send*` | Tree-shakeable request/response helper functions |

## Detailed Guides

- **[Project Structure](.agents/structure.md)** — Source layout and module responsibilities
- **[Architecture](.agents/architecture.md)** — Dispatch pipeline, adapters, hooks, plugins, and design patterns
- **[Testing](.agents/testing.md)** — Jest setup, test conventions, and coverage
- **[Conventions](.agents/conventions.md)** — Linting, commit conventions, CI/CD, and release process
