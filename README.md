<div align="center">

[![Routup banner](./.github/assets/banner.png)](https://routup.net)

</div>

# Routup 🧙‍

[![npm version](https://badge.fury.io/js/routup.svg)](https://badge.fury.io/js/routup)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=CLIA667K6V)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

**Routup** is a minimalistic, runtime-agnostic HTTP routing framework for Node.js, Bun, Deno, and Cloudflare Workers.
Handlers return values directly — routup converts them to Web `Response` objects automatically.

**Table of Contents**

- [Installation](#installation)
- [Features](#features)
- [Documentation](#documentation)
- [Usage](#usage)
- [Plugins](#plugins)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install routup --save
```

## Features

- 🚀 **Runtime agnostic** — Node.js, Bun, Deno, Cloudflare Workers
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
import { Router, coreHandler, errorHandler, serve } from 'routup';

const router = new Router();

router.get('/', coreHandler(() => 'Hello, World!'));
router.get('/greet/:name', coreHandler((event) => `Hello, ${event.params.name}!`));
router.use(errorHandler((error) => ({ error: error.message })));

serve(router, { port: 3000 });
```

**Verbose**

```typescript
import { Router, coreHandler, serve } from 'routup';

const router = new Router();

router.use(coreHandler({
    path: '/',
    method: 'GET',
    fn: () => 'Hello, World!',
}));

router.use(coreHandler({
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
router.use(coreHandler(async (event) => {
    console.log(`${event.method} ${event.path}`);
    return event.next();
}));
```

### Runtimes

Routup runs on any JavaScript runtime:

**Node.js**
```typescript
import { Router, coreHandler, serve } from 'routup';

const router = new Router();
router.get('/', coreHandler(() => 'Hello, World!'));
serve(router, { port: 3000 });
```

**Bun**
```typescript
import { Router, coreHandler, serve } from 'routup/bun';

const router = new Router();
router.get('/', coreHandler(() => 'Hello, World!'));
serve(router, { port: 3000 });
```

**Deno**
```typescript
import { Router, coreHandler, serve } from 'routup/deno';

const router = new Router();
router.get('/', coreHandler(() => 'Hello, World!'));
serve(router, { port: 3000 });
```

**Cloudflare Workers**
```typescript
import { Router, coreHandler } from 'routup/cloudflare';

const router = new Router();
router.get('/', coreHandler(() => 'Hello, World!'));

export default { fetch: (request) => router.fetch(request) };
```

## Plugins

Routup is minimalistic by design. [Plugins](https://github.com/routup/plugins) extend the framework with additional functionality.

| Name | Description |
|------|-------------|
| [assets](https://github.com/routup/plugins/tree/master/packages/assets) | Serve static files from a directory |
| [basic](https://github.com/routup/plugins/tree/master/packages/basic) | Bundle of body, cookie, and query plugins |
| [body](https://github.com/routup/plugins/tree/master/packages/body) | Read and parse the request body |
| [cookie](https://github.com/routup/plugins/tree/master/packages/cookie) | Read and parse request cookies |
| [decorators](https://github.com/routup/plugins/tree/master/packages/decorators) | Class, method, and parameter decorators |
| [prometheus](https://github.com/routup/plugins/tree/master/packages/prometheus) | Collect and serve Prometheus metrics |
| [query](https://github.com/routup/plugins/tree/master/packages/query) | Parse URL query strings |
| [rate-limit](https://github.com/routup/plugins/tree/master/packages/rate-limit) | Rate limit incoming requests |
| [rate-limit-redis](https://github.com/routup/plugins/tree/master/packages/rate-limit-redis) | Redis adapter for rate-limit |
| [swagger](https://github.com/routup/plugins/tree/master/packages/swagger) | Serve Swagger/OpenAPI docs |

## Benchmarks

> **Note:** These benchmarks were recorded with routup v4 (Node.js 18, Sep 2023). Routup v5 uses srvx and Web Standard APIs — updated benchmarks will follow.

To run benchmarks yourself, see the [benchmarks](https://github.com/routup/benchmarks) repository.

## Contributing

Before starting to work on a pull request, it is important to review the guidelines for
[contributing](./CONTRIBUTING.md) and the [code of conduct](./CODE_OF_CONDUCT.md).
These guidelines will help to ensure that contributions are made effectively and are accepted.

## License

Made with 💚

Published under [MIT License](./LICENSE).
