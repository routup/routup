# Project Structure

## Directory Layout

```
routup/
├── src/                    # TypeScript source
│   ├── _entries/           # Runtime entry points
│   │   ├── _common.ts      # Shared entry logic
│   │   ├── node.ts         # Node.js entry (srvx node adapter)
│   │   ├── bun.ts          # Bun entry (srvx bun adapter)
│   │   ├── deno.ts         # Deno entry (srvx deno adapter)
│   │   ├── generic.ts      # Generic Web API entry (srvx generic adapter)
│   │   └── compat.ts       # Compatibility entry (legacy req/res helpers)
│   ├── dispatcher/         # DispatchEvent and pipeline triggers
│   ├── error/              # RoutupError (extends @ebec/http)
│   ├── handler/            # Handler definitions
│   │   ├── core/           # coreHandler — standard request handlers
│   │   └── error/          # errorHandler — error-specific handlers
│   ├── hook/               # Lifecycle hook system
│   ├── path/               # PathMatcher using path-to-regexp
│   ├── plugin/             # Plugin install/management
│   ├── request/            # Request helpers
│   │   ├── helpers/        # Tree-shakeable helper functions (body, headers, IP, etc.)
│   │   └── module.ts       # Legacy request object creation (compat-only, not in public API)
│   ├── response/           # Response helpers
│   │   ├── helpers/        # Tree-shakeable helper functions (cache, headers, etc.)
│   │   ├── to-response.ts  # Converts handler return values to Web Response
│   │   └── module.ts       # Legacy response object creation (compat-only, not in public API)
│   ├── router/             # Router class (central module)
│   ├── router-options/     # Router configuration merging
│   ├── utils/              # Shared utilities
│   ├── constants.ts        # MethodName, HeaderName enums
│   ├── types.ts            # Stream types, handler signatures
│   └── index.ts            # Barrel export (public API)
├── test/                   # Vitest test suite
│   ├── unit/               # Unit tests mirroring src/ structure
│   ├── data/               # Test fixtures
│   └── vitest.config.ts    # Vitest configuration
├── dist/                   # Build output (generated, multi-entry)
├── rollup.config.mjs       # Rollup build configuration
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
| `dispatcher/` | `DispatchEvent` — event object carrying request, params, path, method, mountPath, headers, searchParams through the pipeline |
| `hook/` | Lifecycle events: `request`, `response`, `error` |
| `plugin/` | Plugin system — objects with `name` and `install(router)` method |
| `path/` | `PathMatcher` — wraps `path-to-regexp` for URL pattern matching with query string support |
| `request/helpers/` | Tree-shakeable request helpers (`readBody`, `useRequestHeader`, `useRequestIP`, etc.) |
| `request/module.ts` | Legacy request object creation (compat entry only) |
| `response/helpers/` | Tree-shakeable response helpers (`setResponseHeader`, `setResponseStatus`, etc.) |
| `response/to-response.ts` | Converts handler return values (string, object, Response, etc.) into a Web `Response` |
| `response/module.ts` | Legacy response object creation (compat entry only) |
| `error/` | `RoutupError` extending `@ebec/http` `HTTPError` with statusCode/statusMessage |
| `constants.ts` | `MethodName` and `HeaderName` enums for type-safe HTTP constants |

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `srvx` | Universal HTTP server adapter (Node.js, Bun, Deno, generic Web API) |
| `path-to-regexp` | URL pattern matching (`:id`, wildcards, regex) |
| `@ebec/http` | Base HTTP error class |
| `mime-explorer` | MIME type detection for file serving |
| `negotiator` | HTTP content negotiation |
| `proxy-addr` | Client IP resolution behind proxies |
| `readable-stream` | Cross-runtime stream compatibility (compat entry only) |
| `smob` | Object merge/utility functions |
| `uncrypto` | Cross-platform crypto (ETags, etc.) |

## Build Output

The package ships multiple ESM entry points with TypeScript declarations:

| Entry | Path | Purpose |
|-------|------|---------|
| Node.js | `dist/node.mjs` | Node.js runtime via srvx |
| Bun | `dist/bun.mjs` | Bun runtime via srvx |
| Deno | `dist/deno.mjs` | Deno runtime via srvx |
| Generic | `dist/generic.mjs` | Web API runtimes (Cloudflare Workers, etc.) |
| Compat | `dist/compat.mjs` | Legacy compatibility (req/res object helpers) |
