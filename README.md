<div align="center">

<a href="https://routup.dev"><img src="docs/src/public/logo.svg" width="128" height="128" alt="Routup logo: a stylised letter R in a violet-to-cyan gradient"></a>

<h1>Routup</h1>

</div>

[![npm version](https://badge.fury.io/js/routup.svg)](https://badge.fury.io/js/routup)
[![main](https://github.com/routup/routup/actions/workflows/main.yml/badge.svg)](https://github.com/routup/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/routup/routup/branch/master/graph/badge.svg?token=CLIA667K6V)](https://codecov.io/gh/routup/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/routup/badge.svg)](https://snyk.io/test/github/routup/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

**A minimalistic, runtime-agnostic HTTP routing framework built on Web-standard `Request` and `Response`.**

Handlers return values, middleware awaits `event.next()`, and the same app runs on Node.js, Bun, Deno and Cloudflare Workers.

```typescript
import { App, defineCoreHandler, serve } from 'routup';

const app = new App();

app.get('/users/:id', defineCoreHandler((event) => ({ id: event.params.id })));

serve(app, { port: 3000 });
```

[Why routup?](#why-routup) · [Installation](#installation) · [Usage](#usage) · [Plugins](#plugins) · [Notes](#notes) · [Documentation](https://routup.dev)

---

## Why routup?

A Web `fetch(request)` handler runs everywhere, but it gives you nothing beyond the request: you match paths with string checks, build every `Response` by hand, compute ETags yourself and wire up timeouts with your own `AbortController`. Express and Fastify give you routing, but only on Node.js and with their own `req`/`res` objects.

| Concern | Without it | With routup |
|---------|------------|-------------|
| **Runtimes** | One adapter per runtime, or a Node-only framework | One `App`; `serve(app)` picks the runtime, `app.fetch()` takes any Web `Request` |
| **Responses** | `new Response(JSON.stringify(data), { headers })` in every handler | Return a string, object, stream, `Blob` or `Response`; `toResponse()` sets the content type |
| **Route matching** | `if (url.pathname.startsWith(...))` and hand-parsed params | `path-to-regexp` patterns; params land on `event.params` |
| **Middleware** | Nested function calls or a linear `next()` that cannot see the result | Onion model: `await event.next()` returns the downstream `Response` |
| **ETag and 304** | Hash the body, compare `If-None-Match` | Automatic for string and JSON return values of 2xx `GET`/`HEAD` requests; replace or disable with the `etag` option |
| **Timeouts** | `setTimeout` plus an `AbortController` per request | `timeout` and `handlerTimeout` abort `event.signal` and answer `408` |
| **Route table** | One algorithm, whatever the app size | `LinearRouter`, `TrieRouter` or `SmartRouter`, with an optional lookup cache |
| **Existing middleware** | Rewrite Express middleware | `fromNodeMiddleware(cors())` on a Node.js server |

**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)
  - [Handlers](#handlers)
  - [Return values](#return-values)
  - [Middleware](#middleware)
  - [Error handling](#error-handling)
  - [Nested apps](#nested-apps)
  - [Routers and cache](#routers-and-cache)
  - [Timeouts and cancellation](#timeouts-and-cancellation)
  - [Helpers](#helpers)
  - [Express middleware](#express-middleware)
  - [Runtimes](#runtimes)
- [Options](#options)
- [Templates](#templates)
- [Plugins](#plugins)
- [Notes](#notes)
- [Comparison](#comparison)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install routup --save
```

Routup is ESM-only and needs Node.js 22 or newer. It also runs on Bun, Deno, Cloudflare Workers and Service Workers. The docs at [routup.dev](https://routup.dev) cover every API in detail.

## Usage

### Handlers

A handler receives an event and returns a value. Routup converts the value to a Web `Response`.

**Shorthand**

```typescript
import { App, defineCoreHandler, defineErrorHandler, serve } from 'routup';

const app = new App();

app.get('/', defineCoreHandler(() => 'Hello, World!'));
app.get('/greet/:name', defineCoreHandler((event) => `Hello, ${event.params.name}!`));
app.use(defineErrorHandler((error) => ({ error: error.message })));

serve(app, { port: 3000 });
```

**Verbose**

```typescript
import { App, defineCoreHandler, serve } from 'routup';

const app = new App();

app.use(defineCoreHandler({
    path: '/greet/:name',
    method: 'GET',
    fn: (event) => `Hello, ${event.params.name}!`,
}));

serve(app, { port: 3000 });
```

The verbose form also takes a per-handler `timeout` and the lifecycle callbacks `onBefore`, `onAfter` and `onError`.

### Return values

| Return type | Response |
|-------------|----------|
| `string` | `text/plain` |
| `object` / `array` / `number` / `boolean` | `application/json` |
| `ArrayBuffer` / `Uint8Array` | `application/octet-stream` |
| `ReadableStream` | Streamed to the client |
| `Blob` | Sent with the blob's content type |
| `Response` | Passed through as-is |
| `null` | Empty body, status from `event.response` |

Set the status and headers of a returned value on the response accumulator: `event.response.status = 201` and `event.response.headers.set(name, value)`.

### Middleware

Middleware calls `event.next()` to run the handlers after it and gets their `Response` back:

```typescript
app.use(defineCoreHandler(async (event) => {
    const started = Date.now();
    const response = await event.next();
    console.log(`${event.method} ${event.path} ${Date.now() - started}ms`);
    return response;
}));
```

- Return the result of `event.next()`, or call it and return `undefined`; both forward the downstream response.
- Calling `event.next()` more than once returns the same cached result.
- `event.next(error)` forwards an error to the error handlers.

### Error handling

A thrown error skips the remaining core handlers and runs the matching error handlers:

```typescript
import { AppError, defineCoreHandler, defineErrorHandler } from 'routup';

app.get('/admin', defineCoreHandler(() => {
    throw new AppError({ status: 403, message: 'Forbidden' });
}));

app.use(defineErrorHandler((error, event) => {
    event.response.status = error.status;
    return { error: error.message };
}));
```

`createError()` normalizes any thrown value into an `AppError`. Without an error handler, routup answers with the error's status (default 500), as JSON when the request accepts JSON and plain text otherwise. A request no handler answers gets a `404`.

### Nested apps

```typescript
const api = new App();
api.get('/users', defineCoreHandler(() => []));

const app = new App();
app.use('/api', api); // GET /api/users
```

`app.use(path, child)` copies the child's routes and plugins into the parent at call time. Routes added to the child afterwards do not reach the parent. `new App({ path: '/api' })` prefixes every route registered on that app.

### Routers and cache

The route table is pluggable. `LinearRouter` (the default) suits small apps, `TrieRouter` matches with a radix trie for apps with many routes, and `SmartRouter` picks one of the two at the first lookup (trie at 30 routes or more, configurable with `threshold`). Routers do not cache lookups unless you pass a `cache`: `LruCache` or any `ICache` implementation.

```typescript
import { App, LruCache, TrieRouter } from 'routup';

const app = new App({
    router: new TrieRouter({ cache: new LruCache() }),
});
```

### Timeouts and cancellation

Set a timeout for the whole request, a default per handler, or both. When a deadline fires, `event.signal` is aborted so signal-aware work stops, and routup answers `408 Request Timeout`.

```typescript
const app = new App({
    options: {
        timeout: 30_000,       // entire request
        handlerTimeout: 5_000, // default per handler
    },
});

app.get('/fetch', defineCoreHandler(async (event) => {
    const res = await fetch('https://api.example.com', { signal: event.signal });
    return res.json();
}));
```

A handler's own `timeout` can only narrow `handlerTimeout`, unless `handlerTimeoutOverridable: true` lets it extend the default.

### Helpers

Request and response helpers are standalone functions that take the event first, so unused ones are tree-shaken.

```typescript
import { createEventStream, getRequestIP, sendRedirect } from 'routup';

app.get('/old', defineCoreHandler((event) => sendRedirect(event, '/new', 301)));

app.get('/ip', defineCoreHandler((event) => getRequestIP(event)));

app.get('/events', defineCoreHandler((event) => {
    const stream = createEventStream(event);
    stream.write({ event: 'hello', data: 'world' });
    return stream.response;
}));
```

| Area | Helpers |
|------|---------|
| Request headers | `getRequestHeader`, `matchRequestContentType`, `isRequestCacheable` |
| Proxy-aware | `getRequestIP`, `getRequestHostName`, `getRequestProtocol` |
| Content negotiation | `getRequestAcceptableContentType(s)`, `getRequestAcceptableLanguage(s)`, `getRequestAcceptableEncoding(s)`, `getRequestAcceptableCharset(s)`, `sendFormat` |
| Responses | `sendFile` (ETag, ranges, MIME detection), `sendStream`, `sendRedirect`, `createEventStream` (server-sent events) |
| Response headers | `appendResponseHeader`, `setResponseCacheHeaders`, `setResponseHeaderContentType`, `setResponseHeaderAttachment`, `setResponseHeaderInline` |

The [helpers guide](https://routup.dev/guide/helpers) lists every helper with its options.

### Express middleware

`fromNodeMiddleware()` wraps a `(req, res, next)` middleware and `fromNodeHandler()` a `(req, res)` handler; `fromWebHandler()` wraps a `(request) => Response` function or any object with a `fetch()` method, such as another framework's app.

```typescript
import cors from 'cors';
import { fromNodeMiddleware } from 'routup';

app.use(fromNodeMiddleware(cors()));
```

The Node adapters need a Node.js server: `serve()` on Node.js, or `toNodeHandler(app)` from `routup/node` passed to `createServer()`. See [Express compatibility](https://routup.dev/guide/express-compatibility).

### Runtimes

`import { serve } from 'routup'` works on every runtime. Import a runtime entry to select its adapter or use runtime-specific APIs:

| Entry | Use for |
|-------|---------|
| `routup` | Every runtime, through the package's export conditions |
| `routup/node` | Node.js; adds `toNodeHandler()` |
| `routup/bun` / `routup/deno` | Bun's and Deno's native servers |
| `routup/cloudflare` | Cloudflare Workers |
| `routup/service-worker` | Service Workers |
| `routup/generic` | Any other Web API runtime |

## Options

Pass these as `new App({ options: { ... } })`. Mounted apps inherit them.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | none | Timeout in ms for the whole request; answers `408` |
| `handlerTimeout` | `number` | none | Default timeout in ms for each handler |
| `handlerTimeoutOverridable` | `boolean` | `false` | Whether a handler's `timeout` may exceed `handlerTimeout` |
| `etag` | function, options, boolean or `null` | weak ETags | ETag generator or `{ weak }` options; `false` or `null` disables ETag and `304` |
| `trustProxy` | function, boolean, hop count, string or list of addresses | trust none | Which proxies to trust for the IP, hostname and protocol helpers |

Beside `options`, the constructor takes `router`, `path` and `name`.

## Templates

Scaffold a new project from any starter in [`routup/templates`](https://github.com/routup/templates) with [`degit`](https://github.com/Rich-Harris/degit):

```bash
npx degit routup/templates/node-api my-app
```

| Template | Runtime | Highlights |
|----------|---------|------------|
| [node-api](https://github.com/routup/templates/tree/master/node-api) | Node.js >=22 | JSON API with `@routup/body` |
| [cloudflare-worker](https://github.com/routup/templates/tree/master/cloudflare-worker) | Cloudflare Workers | Configured with `wrangler` |
| [bun-decorators](https://github.com/routup/templates/tree/master/bun-decorators) | Bun | Class-based routing via `@routup/decorators` |

## Plugins

A plugin is an object with a `name` and an `install(app)` function, plus an optional semver `version` and a `singleton` flag. Without `singleton`, installing a plugin twice installs it twice.

```typescript
app.use({
    name: 'powered-by',
    install(target) {
        target.use(defineCoreHandler((event) => {
            event.response.headers.set('x-powered-by', 'routup');
            return event.next();
        }));
    },
});
```

The [plugins repository](https://github.com/routup/plugins) provides:

| Name | Description |
|------|-------------|
| [assets](https://github.com/routup/plugins/tree/master/packages/assets) | Serve static files from a directory |
| [basic](https://github.com/routup/plugins/tree/master/packages/basic) | Bundle of body, cookie, and query plugins |
| [body](https://github.com/routup/plugins/tree/master/packages/body) | Read and parse the request body |
| [cookie](https://github.com/routup/plugins/tree/master/packages/cookie) | Read and parse request cookies |
| [cors](https://github.com/routup/plugins/tree/master/packages/cors) | Cross-Origin Resource Sharing (CORS) middleware |
| [decorators](https://github.com/routup/plugins/tree/master/packages/decorators) | Class, method, and parameter decorators |
| [i18n](https://github.com/routup/plugins/tree/master/packages/i18n) | Translation and internationalization |
| [logger](https://github.com/routup/plugins/tree/master/packages/logger) | HTTP request logger with morgan-compatible tokens and presets |
| [prometheus](https://github.com/routup/plugins/tree/master/packages/prometheus) | Collect and serve Prometheus metrics |
| [query](https://github.com/routup/plugins/tree/master/packages/query) | Parse URL query strings |
| [rate-limit](https://github.com/routup/plugins/tree/master/packages/rate-limit) | Rate limit incoming requests |
| [rate-limit-redis](https://github.com/routup/plugins/tree/master/packages/rate-limit-redis) | Redis adapter for rate-limit |
| [swagger-ui](https://github.com/routup/plugins/tree/master/packages/swagger-ui) | Mount swagger-ui-dist on any path |

## Notes

- **Returning `undefined` is not a pass-through.** A handler that returns `undefined` without having called `event.next()` keeps the request open until it calls `event.next()` later or a timeout fires. With no timeout configured, the request hangs.
- **Middleware cannot rewrite the path.** The matched handlers are fixed when the request arrives, and `event.path` is a snapshot.
- **Mounting copies.** `app.use('/api', child)` flattens the child's routes into the parent; later changes to the child are not seen.
- **ETags only for string and JSON values of 2xx `GET` and `HEAD`.** A returned `Response`, stream, `Blob` or binary body gets no automatic ETag (`sendFile()` sets its own), and other methods or statuses never get a `304`.
- **`OPTIONS` is answered for you.** When no handler answers an `OPTIONS` request, routup responds with an `Allow` header built from the matched routes.
- **Node adapters need a Node server.** `fromNodeHandler()` and `fromNodeMiddleware()` answer `500` under a plain `app.fetch(new Request(...))`, so test such apps through `toNodeHandler(app)` and `node:http`.

## Comparison

How routup compares with other routing frameworks. This is a best-effort summary; check each project's docs for the full picture.

|                                         | routup            | [Hono](https://hono.dev) | [Express](https://expressjs.com) | [Fastify](https://fastify.dev) |
|-----------------------------------------|-------------------|--------------------------|----------------------------------|--------------------------------|
| **Runtimes**                            | Node, Bun, Deno, Cloudflare, Service Worker | Node, Bun, Deno, Cloudflare, Lambda, Vercel | Node | Node |
| **Web-standard `Request` / `Response`** | ✅ | ✅ | ❌ | ❌ |
| **Return-based handlers**               | ✅ | ✅ | ❌ | ✅ |
| **TypeScript-first**                    | ✅ | ✅ | community types | ✅ |
| **Tree-shakeable helpers**              | ✅ | ✅ | ❌ | ❌ |
| **Onion middleware (`next()`)**         | ✅ | ✅ | linear `next()` | lifecycle hooks |
| **Pluggable router**                    | ✅ linear, trie, or auto-select | ✅ RegExp, trie, linear, pattern, or auto-select | linear only | radix only |
| **ETag + 304**                          | ✅ built in | via middleware | built in (weak ETag) | via plugin |
| **Per-handler timeout + `AbortSignal`** | ✅ | via middleware | ❌ | server-level |
| **Class-based routes (decorators)**     | ✅ via plugin | ❌ | ❌ | ❌ |
| **Express middleware bridge**           | ✅ `fromNodeMiddleware` | ❌ | n/a | via plugin |
| **Schema validation built-in**          | ❌ | via middleware | ❌ | ✅ |

## Contributing

Before starting to work on a pull request, it is important to review the guidelines for
[contributing](./CONTRIBUTING.md) and the [code of conduct](./CODE_OF_CONDUCT.md).
These guidelines will help to ensure that contributions are made effectively and are accepted.

## License

Made with 💚

Published under [MIT License](./LICENSE).
