<div align="center">

[![Routup banner](./.github/assets/banner.png)](https://routup.net)

</div>

# Routup 🧙‍

[![npm version](https://badge.fury.io/js/routup.svg)](https://badge.fury.io/js/routup)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=CLIA667K6V)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

**Routup** is a fast, lightweight, runtime agnostic and asynchronous routing framework.
Helpers provide additional functionalities to interact with the request and manipulate the response.

It can be used independently of the selected runtime environment (Node.Js, Bun, ... ) 🎉.
Moreover, it is even **228%** faster than Express ([more](#benchmarks)).

**Table of Contents**

- [Installation](#installation)
- [Features](#features)
- [Documentation](#documentation)
- [Usage](#usage)
- [Plugins](#plugins)
- [Benchmarks](#benchmarks)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install routup --save
```

## Features

- 🚀 runtime agnostic (Node.JS, Bun, Deno, ...)
- 📝 different handler types (base & error)
- ✨ promise (async) support for core- & error-handlers
- 📌 robust hook system
- 🔌 powerful plugin system
- 🧰 tree shakeable response & request helpers
- 🤝️ different handler declaration styles (shorthand & verbose)
- 📁 nestable routers
- 👕 TypeScript support
- 🤏 minimalistic to fit into any solution with minimum overhead
- & much more

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

The following examples are intended to give a small insight into the use of the framework.
However, it is highly recommended to read the [documentation](https://routup.net), 
as all concepts and basics are taught there.

### Handlers

Both core and error handlers, can be defined in two different ways.
Core handler functions can have up to 3 arguments (req, res, next) whereas error handler functions can have up to 4 arguments (err, req, res, next).
This should be familiar to anyone who has used express before.

**`Shorthand`**

With the shorthand variant, 
only the handler function is passed as argument to the **coreHandler** & **errorHandler** function.

```typescript
import { createServer } from 'node:http';
import {
    coreHandler,
    createNodeDispatcher,
    errorHandler,
    Router,
    useRequestParam
} from 'routup';

const router = new Router();

router.get('/', coreHandler(() => 'Hello, World!'));
router.get('/greet/:name', coreHandler((req) => `Hello, ${useRequestParam(req, 'name')}!`));
router.use(errorHandler((err) => `An error with statusCode ${err.statusCode} occured.`));

const server = createServer(createNodeDispatcher(router));
server.listen(3000)
```

**`Verbose`**

The verbose variant is more complex, but offers the possibility to set additional information
like **path**, **method**, ... in the handler definition.

```typescript
import { createServer } from 'node:http';
import {
    coreHandler,
    createNodeDispatcher,
    errorHandler,
    Router,
    useRequestParam
} from 'routup';

const router = new Router();

router.get(coreHandler({
    path: '/',
    fn: () => 'Hello, World!',
}));

router.get(coreHandler({
    path: '/greet/:name',
    fn: (req) => `Hello, ${useRequestParam(req, 'name')}!`
}))

router.use(errorHandler({
    fn: (err) => `An error with statusCode ${err.statusCode} occured.`
}))

const server = createServer(createNodeDispatcher(router));
server.listen(3000)
```

### Runtimes

It is possible to use any javascript runtime environment. Below are examples for Bun and Deno.
These use the web dispatcher to submit requests based on the web api. Besides the node- & web-dispatcher, 
there is also a plain dispatcher that underlies the web dispatcher, which can be controlled via a simple API.

**`Bun`**

```typescript
import {
    coreHandler,
    createWebDispatcher,
    Router
} from 'routup';

const router = new Router();

router.get('/', coreHandler(() => 'Hello, World!'));

const dispatch = createWebDispatcher(router);

Bun.serve({
    async fetch(request) {
        return dispatch(request);
    },
    port: 3000,
});
```

**`Deno`**

```typescript
import {
    coreHandler,
    createWebDispatcher,
    Router
} from 'routup';

const router = new Router();

router.get('/', coreHandler(() => 'Hello, World!'));

const dispatch = createWebDispatcher(router);

const server = Deno.listen({
    port: 3000
});
for await (const conn of server) {
    const httpConn = Deno.serveHttp(conn);

    for await (const requestEvent of httpConn) {
        const response = await dispatch(
            requestEvent.request
        );
        requestEvent.respondWith(response);
    }
}
```

## Plugins

According to the fact that routup is a minimalistic framework, 
it depends on [plugins](https://github.com/routup/plugins) to cover some 
typically http framework functions, which are not integrated in the main package.

| Name                                                                                        | Description                                                            |
|---------------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| [assets](https://github.com/routup/plugins/tree/master/packages/assets)                     | Serve static files from a directory.                                   |
| [basic](https://github.com/routup/plugins/tree/master/packages/basic)                       | Bundle of the body, cookie and query plugin.                           |
| [body](https://github.com/routup/plugins/tree/master/packages/body)                         | Read and parse the request body.                                       |
| [cookie](https://github.com/routup/plugins/tree/master/packages/cookie)                     | Read and parse request cookies and serialize cookies for the response. |
| [decorators](https://github.com/routup/plugins/tree/master/packages/decorators)             | Create request handlers with class-, method- & parameter-decorators.   |
| [prometheus](https://github.com/routup/plugins/tree/master/packages/prometheus)             | Collect and serve metrics for prometheus.                              |
| [query](https://github.com/routup/plugins/tree/master/packages/query)                       | Read and parse the query string of the request url.                    |
| [rate-limit](https://github.com/routup/plugins/tree/master/packages/rate-limit)             | Rate limit incoming requests.                                          |
| [rate-limit-redis](https://github.com/routup/plugins/tree/master/packages/rate-limit-redis) | Redis adapter for the rate-limit plugin.                               |
| [swagger](https://github.com/routup/plugins/tree/master/packages/swagger)                   | Serve generated docs from URL or based on a JSON file.                 |

## Benchmarks

* CPUs:  `24`
* RAM:  `63.9GB`
* Node: `v18.16.0`
* Date:  `Wed Sep 13 2023 15:11:58 GMT+0200 (Mitteleuropäische Sommerzeit) `
* Method: `autocannon -c 100 -d 40 -p 10 localhost:3000` (two rounds; one to warm-up, one to measure)

| Package    | Requests/s  | Latency (ms) | Throughput/MB |
|:-----------|:-----------:|-------------:|--------------:|
| http       |    61062    |        15.87 |         10.89 |
| fastify    |    59679    |        16.26 |         10.70 |
| koa        |    45763    |        21.35 |          8.16 |
| **routup** |    44588    |        21.91 |          9.02 |
| hapi       |    41374    |        23.67 |          7.38 |
| express    |    13376    |        74.18 |          2.39 |

Benchmarks were generated using autocannon. 
To recreate the results, this can be done using the [benchmarks'](https://github.com/routup/benchmarks) repository.
## Contributing

Before starting to work on a pull request, it is important to review the guidelines for
[contributing](./CONTRIBUTING.md) and the [code of conduct](./CODE_OF_CONDUCT.md).
These guidelines will help to ensure that contributions are made effectively and are accepted.

## License

Made with 💚

Published under [MIT License](./LICENSE).
