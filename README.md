<div align="center">

[![Routup banner](.github/assets/banner.png)](https://routup.dev)

</div>

# Routup 🧙‍

[![npm version](https://badge.fury.io/js/routup.svg)](https://badge.fury.io/js/routup)
[![main](https://github.com/routup/routup/actions/workflows/main.yml/badge.svg)](https://github.com/routup/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/routup/routup/branch/master/graph/badge.svg?token=CLIA667K6V)](https://codecov.io/gh/routup/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/routup/badge.svg)](https://snyk.io/test/github/routup/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

**Routup** is a minimalistic, runtime-agnostic HTTP routing framework for Node.js, Bun, Deno, and Cloudflare Workers.
Handlers return values directly — routup converts them to Web `Response` objects automatically.

**Table of Contents**

- [Installation](#installation)
- [Features](#features)
- [Documentation](#documentation)
- [Usage](#usage)
- [Templates](#templates)
- [Plugins](#plugins)
- [Comparison](#comparison)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install routup --save
```

## Features

- 🚀 **Runtime agnostic** — Node.js, Bun, Deno, Cloudflare Workers
- 🌐 **Web-standard APIs** — built on `Request` / `Response` for portability
- 📝 **Return-based handlers** — return strings, objects, streams, or `Response` directly
- ✨ **Async middleware** — onion model with `event.next()`
- 📌 **Lifecycle hooks** — `request`, `response`, `error` for cross-cutting concerns
- 🔌 **Plugin system** — extend with reusable, installable plugins
- 🧰 **Tree-shakeable helpers** — import only what you use
- 📁 **Nestable routers** — modular route composition
- 👕 **TypeScript first** — fully typed API with generics
- 🤏 **Minimal footprint** — small core, no bloat

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

### Handlers

Handlers receive an event and return a value. Routup converts the return value to a Web `Response` automatically.

**Shorthand**

```typescript
import { Router, defineCoreHandler, defineErrorHandler, serve } from 'routup';

const router = new Router();

router.get('/', defineCoreHandler(() => 'Hello, World!'));
router.get('/greet/:name', defineCoreHandler((event) => `Hello, ${event.params.name}!`));
router.use(defineErrorHandler((error) => ({ error: error.message })));

serve(router, { port: 3000 });
```

**Verbose**

```typescript
import { Router, defineCoreHandler, serve } from 'routup';

const router = new Router();

router.use(defineCoreHandler({
    path: '/',
    method: 'GET',
    fn: () => 'Hello, World!',
}));

router.use(defineCoreHandler({
    path: '/greet/:name',
    method: 'GET',
    fn: (event) => `Hello, ${event.params.name}!`,
}));

serve(router, { port: 3000 });
```

### Return Values

| Return type | Response |
|-------------|----------|
| `string` | `text/plain` |
| `object` / `array` | `application/json` |
| `Response` | Passed through as-is |
| `ReadableStream` | Streamed to client |
| `Blob` | Sent with blob's content type |
| `null` | Empty response (status from `event.response`) |

### Middleware

Middleware calls `event.next()` to continue the pipeline:

```typescript
router.use(defineCoreHandler(async (event) => {
    console.log(`${event.method} ${event.path}`);
    return event.next();
}));
```

### Runtimes

Routup runs on Node.js, Bun, Deno, and Cloudflare Workers. In most cases, import from `routup`:

```typescript
import { Router, defineCoreHandler, serve } from 'routup';

const router = new Router();
router.get('/', defineCoreHandler(() => 'Hello, World!'));
serve(router, { port: 3000 });
```

For runtime-specific APIs (e.g. `toNodeHandler`), use the corresponding entrypoint like `routup/node`.

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

Routup is minimalistic by design. [Plugins](https://github.com/routup/plugins) extend the framework with additional functionality.

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

## Comparison

How routup stacks up against other popular Node.js routing frameworks. This is a best-effort summary; check each project's docs for the full picture.

|                                       | routup            | [Hono](https://hono.dev) | [Express](https://expressjs.com) | [Fastify](https://fastify.dev) |
|---------------------------------------|-------------------|--------------------------|----------------------------------|--------------------------------|
| **Runtimes**                          | Node, Bun, Deno, Cloudflare, Service Worker | Node, Bun, Deno, Cloudflare, Lambda, Vercel | Node | Node |
| **Web-standard `Request` / `Response`** | ✅ | ✅ | ❌ | ❌ |
| **Return-based handlers**             | ✅ | ✅ | ❌ | ❌ |
| **TypeScript-first**                  | ✅ | ✅ | community types | ✅ |
| **Tree-shakeable helpers**            | ✅ | ✅ | ❌ | ❌ |
| **Onion middleware (`next()`)**       | ✅ | ✅ | linear `next()` | lifecycle hooks |
| **Class-based routes (decorators)**   | ✅ via plugin | ❌ | ❌ | ❌ |
| **Express middleware bridge**         | ✅ `fromNodeHandler` | ❌ | n/a | limited |
| **Per-handler timeout + `AbortSignal`** | ✅ | ❌ | ❌ | server-level |
| **Schema validation built-in**        | ❌ | ❌ | ❌ | ✅ |

## Benchmarks

Recorded with routup v5.1 on Node.js 24, May 2026. `autocannon -c 100 -d 40 -p 10` (40s warm-up, 40s measure).

| Package    | Requests/s | Latency (ms) | Throughput/MB |
|:-----------|:----------:|-------------:|--------------:|
| http       |   167021   |         5.47 |         29.79 |
| fastify    |   152567   |         6.02 |         27.35 |
| hono       |   137181   |         6.81 |         22.50 |
| koa        |   136575   |         6.79 |         24.36 |
| hapi       |   118206   |         7.99 |         21.08 |
| express    |   104533   |         9.06 |         18.64 |
| **routup** |    95979   |         9.93 |         18.67 |

Routup currently trails on raw req/s for the trivial `GET /` case — the focus of v5 has been runtime portability and ergonomics rather than micro-optimization. Throughput is competitive with express. To re-run the suite yourself, see the [benchmarks](https://github.com/routup/benchmarks) repository.

## Contributing

Before starting to work on a pull request, it is important to review the guidelines for
[contributing](./CONTRIBUTING.md) and the [code of conduct](./CODE_OF_CONDUCT.md).
These guidelines will help to ensure that contributions are made effectively and are accepted.

## License

Made with 💚

Published under [MIT License](./LICENSE).
