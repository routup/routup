# Project Structure

## Directory Layout

```
routup/
├── src/                    # TypeScript source (121 files)
│   ├── adapters/           # Runtime adapters (node, web, raw)
│   ├── dispatcher/         # DispatchEvent and pipeline triggers
│   ├── error/              # RoutupError (extends @ebec/http)
│   ├── handler/            # Handler definitions
│   │   ├── core/           # coreHandler — standard request handlers
│   │   └── error/          # errorHandler — error-specific handlers
│   ├── hook/               # Lifecycle hook system
│   ├── path/               # PathMatcher using path-to-regexp
│   ├── plugin/             # Plugin install/management
│   ├── request/            # Request creation and helpers
│   ├── response/           # Response creation and helpers
│   ├── router/             # Router class (central module)
│   ├── router-options/     # Router configuration merging
│   ├── utils/              # Shared utilities
│   ├── constants.ts        # MethodName, HeaderName enums
│   ├── types.ts            # Stream types, Next callback
│   └── index.ts            # Barrel export (public API)
├── test/                   # Jest test suite (32 spec files)
│   ├── unit/               # Unit tests mirroring src/ structure
│   ├── data/               # Test fixtures
│   └── jest.config.js      # Jest configuration
├── dist/                   # Build output (generated)
│   ├── index.cjs           # CommonJS bundle
│   ├── index.mjs           # ES Module bundle
│   └── index.d.ts          # TypeScript declarations
├── rollup.config.mjs       # Rollup build configuration
├── tsconfig.json           # TypeScript compiler config
└── package.json            # Project manifest
```

## Module Responsibilities

| Module | Purpose |
|--------|---------|
| `router/` | Core `Router` class — registers handlers, manages stack, dispatches requests through pipeline steps |
| `handler/core/` | `coreHandler()` factory — creates typed request handlers with shorthand and verbose syntax |
| `handler/error/` | `errorHandler()` factory — creates error handlers that receive `(err, req, res, next)` |
| `dispatcher/` | `DispatchEvent` — immutable event object carrying request, response, path, method, params through the pipeline |
| `adapters/node/` | `createNodeDispatcher()` — bridges Router to Node.js `http.createServer()` |
| `adapters/web/` | `createWebDispatcher()` — bridges Router to Web API `Request → Response` |
| `adapters/raw/` | Lower-level adapter for custom runtime integrations |
| `hook/` | Lifecycle events: `dispatchStart`, `dispatchEnd`, `childMatch`, `childDispatchBefore`, `childDispatchAfter`, `error` |
| `plugin/` | Plugin system — objects with `name` and `install(router)` method |
| `path/` | `PathMatcher` — wraps `path-to-regexp` for URL pattern matching with query string support |
| `request/` | Request object creation and tree-shakeable helpers (`useRequestPath`, `useRequestParams`, etc.) |
| `response/` | Response object creation and helpers (`send`, `sendFile`, `setResponseHeader`, etc.) |
| `error/` | `RoutupError` extending `@ebec/http` `HTTPError` with statusCode/statusMessage |
| `constants.ts` | `MethodName` and `HeaderName` enums for type-safe HTTP constants |

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `path-to-regexp` | URL pattern matching (`:id`, wildcards, regex) |
| `@ebec/http` | Base HTTP error class |
| `mime-explorer` | MIME type detection for file serving |
| `negotiator` | HTTP content negotiation |
| `proxy-addr` | Client IP resolution behind proxies |
| `readable-stream` | Cross-runtime stream compatibility |
| `smob` | Object merge/utility functions |
| `uncrypto` | Cross-platform crypto (ETags, etc.) |

## Build Output

The package ships dual CJS/ESM with TypeScript declarations:

| Field | Path | Format |
|-------|------|--------|
| `main` | `dist/index.cjs` | CommonJS |
| `module` | `dist/index.mjs` | ES Module |
| `types` | `dist/index.d.ts` | TypeScript |
