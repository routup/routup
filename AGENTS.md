<!-- NOTE: Keep this file and all corresponding files in the .agents directory updated as the project evolves. When making architectural changes, adding new patterns, or discovering important conventions, update the relevant sections. -->

# Routup — Agent Guide

Routup is a minimalistic, runtime-agnostic HTTP routing framework for Node.js, Bun, Deno, and Cloudflare Workers. It uses srvx as the universal HTTP server layer, providing return-based handlers, async middleware, a plugin/hook system, and tree-shakeable request/response helpers.

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
| `Router` | Core routing engine — register handlers, nest routers, define hooks; exposes `fetch()` entry point |
| `defineCoreHandler()` | Factory for request handlers `(event) => Response \| any` |
| `defineErrorHandler()` | Factory for error handlers `(error, event) => Response \| any` |
| `serve(router)` | Start an HTTP server for the current runtime (from entry files) |
| `toNodeHandler(router)` | Convert router to Node.js `(req, res) => void` handler (Node entry) |
| `useRequest*` / `setResponse*` | Tree-shakeable request/response helper functions |

## Detailed Guides

- **[Project Structure](.agents/structure.md)** — Source layout and module responsibilities
- **[Architecture](.agents/architecture.md)** — Dispatch pipeline, srvx integration, hooks, plugins, and design patterns
- **[Testing](.agents/testing.md)** — Vitest setup, test conventions, and coverage
- **[Conventions](.agents/conventions.md)** — Linting, commit conventions, CI/CD, and release process
