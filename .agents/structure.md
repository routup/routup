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
│   ├── app/                # App class (central module) and options
│   ├── cache/              # ICache and LruCache for router lookups
│   ├── dispatcher/         # IDispatcher, DispatcherEvent
│   ├── event/              # AppEvent class and IAppEvent interface
│   ├── error/              # AppError (extends @ebec/http), createError, isError
│   ├── handler/            # Handler definitions
│   │   ├── core/           # defineCoreHandler — standard request handlers
│   │   ├── error/          # defineErrorHandler — error-specific handlers
│   │   └── adapters/       # fromNodeHandler, fromNodeMiddleware, fromWebHandler
│   ├── path/               # PathMatcher using path-to-regexp
│   ├── plugin/             # Plugin types, checks and errors
│   ├── request/            # Request helpers
│   │   └── helpers/        # Tree-shakeable helper functions (headers, hostname, IP, etc.)
│   ├── response/           # Response helpers
│   │   ├── helpers/        # Tree-shakeable helper functions (cache, headers, send*, etc.)
│   │   └── to-response.ts  # Converts handler return values to Web Response
│   ├── router/             # IRouter and the linear, trie and smart routers
│   ├── utils/              # Shared utilities
│   ├── constants.ts        # MethodName, HeaderName constants
│   ├── types.ts            # Shared types
│   └── index.ts            # Barrel export (public API)
├── test/                   # Vitest test suite
│   ├── unit/               # Unit tests
│   ├── data/               # Test fixtures
│   ├── helpers.ts          # createTestRequest and event helpers
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
| `app/` | Core `App` class — registers handlers, mounts apps, installs plugins, dispatches requests, exposes `fetch()` |
| `router/` | `IRouter` route-table family: `LinearRouter` (default), `TrieRouter`, `SmartRouter` |
| `cache/` | `ICache` contract and the `LruCache` default used by routers |
| `handler/core/` | `defineCoreHandler()` factory — creates typed request handlers with shorthand and verbose syntax |
| `handler/error/` | `defineErrorHandler()` factory — creates error handlers that receive `(error, event)` |
| `handler/adapters/` | `fromNodeHandler()`, `fromNodeMiddleware()`, `fromWebHandler()` — wrap foreign handlers for use in routup |
| `dispatcher/` | `IDispatcher` interface and the `DispatcherEvent` carried through the pipeline |
| `event/` | `AppEvent` class and `IAppEvent` interface — the event object handed to each handler |
| `plugin/` | Plugin contract — objects with `name` and `install(app)` |
| `path/` | `PathMatcher` — wraps `path-to-regexp` for URL pattern matching |
| `request/helpers/` | Tree-shakeable request helpers (`getRequestHeader`, `getRequestIP`, etc.) |
| `response/helpers/` | Tree-shakeable response helpers (`sendFile`, `sendRedirect`, `sendStream`, etc.) |
| `response/to-response.ts` | Converts handler return values (string, object, Response, etc.) into a Web `Response` with automatic ETag/304 |
| `error/` | `AppError` extending `@ebec/http` `HTTPError` with `status` and `message` |
| `constants.ts` | `MethodName` and `HeaderName` constants for type-safe HTTP values |

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `srvx` | Universal HTTP server adapter (Node.js, Bun, Deno, Cloudflare, etc.) |
| `path-to-regexp` | URL pattern matching (`:id`, wildcards, regex) |
| `@ebec/http` / `@ebec/core` | Base HTTP error class and instanceof brands |
| `content-disposition` | `Content-Disposition` creation and parsing |
| `mime-explorer` | MIME type detection for file serving |
| `negotiator` | HTTP content negotiation |
| `proxy-addr` | Trust proxy compilation for hostname/protocol helpers |
| `quick-lru` | Backing store of `LruCache` |
| `smob` | Object merge/utility functions |
| `uncrypto` | Cross-platform crypto (ETags, etc.) |

## Build Output

The package ships multiple ESM entry points with TypeScript declarations:

| Entry | Path | Purpose |
|-------|------|---------|
| Node.js | `dist/node.mjs` | Node.js runtime via srvx (includes `toNodeHandler`) |
| Bun | `dist/bun.mjs` | Bun runtime via srvx |
| Deno | `dist/deno.mjs` | Deno runtime via srvx |
| Generic | `dist/generic.mjs` | Generic Web API runtimes |
| Cloudflare | `dist/cloudflare.mjs` | Cloudflare Workers via srvx |
| Service Worker | `dist/service-worker.mjs` | Service Worker via srvx |
