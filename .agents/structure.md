# Project Structure

## Directory Layout

```text
routup/
├── src/                    # TypeScript source
│   ├── _entries/           # Runtime entry points
│   │   ├── node.ts         # Node.js entry (srvx node adapter)
│   │   ├── bun.ts          # Bun entry (srvx bun adapter)
│   │   ├── deno.ts         # Deno entry (srvx deno adapter)
│   │   ├── generic.ts      # Generic Web API entry (srvx generic adapter)
│   │   ├── cloudflare.ts   # Cloudflare Workers entry
│   │   └── service-worker.ts # Service Worker entry
│   ├── dispatcher/         # Dispatcher interface and pipeline triggers
│   ├── event/              # RoutupEvent class and IRoutupEvent interface
│   ├── error/              # RoutupError (extends @ebec/http)
│   ├── handler/            # Handler definitions
│   │   ├── core/           # coreHandler — standard request handlers
│   │   ├── error/          # errorHandler — error-specific handlers
│   │   └── helpers/        # fromNodeHandler — Node.js middleware bridge
│   ├── hook/               # Lifecycle hook system
│   ├── path/               # PathMatcher using path-to-regexp
│   ├── plugin/             # Plugin install/management
│   ├── request/            # Request helpers
│   │   └── helpers/        # Tree-shakeable helper functions (body, headers, IP, etc.)
│   ├── response/           # Response helpers
│   │   ├── helpers/        # Tree-shakeable helper functions (cache, headers, etc.)
│   │   └── to-response.ts  # Converts handler return values to Web Response
│   ├── router/             # Router class (central module)
│   ├── router-options/     # Router configuration merging
│   ├── utils/              # Shared utilities
│   ├── constants.ts        # MethodName, HeaderName enums
│   └── index.ts            # Barrel export (public API)
├── test/                   # Vitest test suite
│   ├── unit/               # Unit tests mirroring src/ structure
│   ├── data/               # Test fixtures
│   └── vitest.config.ts    # Vitest configuration
├── docs/                   # VitePress documentation site
│   ├── src/                # Documentation source (guide, API reference)
│   └── package.json        # VitePress dependencies
├── dist/                   # Build output (generated, multi-entry)
├── tsdown.config.ts        # tsdown build configuration
├── tsconfig.json           # TypeScript compiler config
└── package.json            # Project manifest
```

## Module Responsibilities

| Module | Purpose |
|--------|---------|
| `_entries/` | Runtime-specific entry points — each re-exports core API plus runtime adapter (`serve`, `toNodeHandler`, etc.) via srvx |
| `router/` | Core `Router` class — registers handlers, manages stack, dispatches requests through pipeline steps, exposes `fetch()` |
| `handler/core/` | `coreHandler()` factory — creates typed request handlers with shorthand and verbose syntax |
| `handler/error/` | `errorHandler()` factory — creates error handlers that receive `(error, event)` |
| `handler/helpers/` | `fromNodeHandler()` — wraps Node.js `(req, res)` or `(req, res, next)` middleware for use in routup |
| `dispatcher/` | `IDispatcher` interface for dispatch pipeline |
| `event/` | `RoutupEvent` class and `IRoutupEvent` interface — event object carrying request, params, path, method, mountPath, headers, searchParams, store through the pipeline |
| `hook/` | Lifecycle events: `request`, `response`, `error` |
| `plugin/` | Plugin system — objects with `name` and `install(router)` method |
| `path/` | `PathMatcher` — wraps `path-to-regexp` for URL pattern matching with query string support |
| `request/helpers/` | Tree-shakeable request helpers (`readBody`, `getRequestHeader`, `getRequestIP`, etc.) |
| `response/helpers/` | Tree-shakeable response helpers (`sendFile`, `sendRedirect`, `sendCreated`, etc.) |
| `response/to-response.ts` | Converts handler return values (string, object, Response, etc.) into a Web `Response` with automatic ETag/304 |
| `error/` | `RoutupError` extending `@ebec/http` `HTTPError` with statusCode/statusMessage |
| `constants.ts` | `MethodName` and `HeaderName` enums for type-safe HTTP constants |

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `srvx` | Universal HTTP server adapter (Node.js, Bun, Deno, Cloudflare, etc.) |
| `path-to-regexp` | URL pattern matching (`:id`, wildcards, regex) |
| `@ebec/http` | Base HTTP error class |
| `mime-explorer` | MIME type detection for file serving |
| `negotiator` | HTTP content negotiation |
| `proxy-addr` | Trust proxy compilation for hostname/protocol helpers |
| `smob` | Object merge/utility functions |
| `uncrypto` | Cross-platform crypto (ETags, etc.) |

## Build Output

The package ships multiple ESM/CJS entry points with TypeScript declarations:

| Entry | Path | Purpose |
|-------|------|---------|
| Node.js | `dist/node.mjs` | Node.js runtime via srvx (includes `toNodeHandler`) |
| Bun | `dist/bun.mjs` | Bun runtime via srvx |
| Deno | `dist/deno.mjs` | Deno runtime via srvx |
| Generic | `dist/generic.mjs` | Generic Web API runtimes |
| Cloudflare | `dist/cloudflare.mjs` | Cloudflare Workers via srvx |
| Service Worker | `dist/service-worker.mjs` | Service Worker via srvx |
