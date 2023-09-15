<div align="center">

[![Routup banner](./.github/assets/banner.png)](https://routup.net)

</div>

# Routup 🧙‍

[![npm version](https://badge.fury.io/js/routup.svg)](https://badge.fury.io/js/routup)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=CLIA667K6V)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

**Routup** is a lightweight, runtime agnostic and extendable routing library.
It uses node's vanilla request and response interfaces, which are injected into route handlers aka middlewares as function argument.
Helpers provide additional functionalities to transform and interact with the request and manipulate the response upstream.

Use the same routing framework for each project, regardless of the used runtime environment (Node.Js, Bun, ... ) 🎉.
Besides, it is even **228%** faster than Express ([more](#benchmarks)).



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
- 🧰 response & request composables/helpers
- 💼 extendable & compact
- 🛫 named route parameters
- 📁 nestable routers
- 🤝️ define one or many (error-) middlewares (inc. express middlewares)
- ✨ promise support for route- & middleware-handlers
- 👕 TypeScript fully supported
- 🤏 Minimalistic to fit into any solution with minimum overhead
- & much more

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

It is possible to use Routup in any javascript runtime environment. Below are examples for Node.Js, Bun and Deno.
There are different [dispatchers](https://routup.net/guide/dispatcher) how requests can be transmitted in different ways.

**`NodeJs`**

```typescript
import {createServer} from 'node:http';
import {
    createNodeDispatcher,
    Router,
    send
} from 'routup';

const router = new Router();

router.get('/', () => 'Hello World');

const server = createServer(createNodeDispatcher(router));
server.listen(3000)
```

**`Bun`**

```typescript
import {
    createWebDispatcher,
    Router,
    send
} from 'routup';

const router = new Router();

router.get('/', () => 'Hello World');

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
    createWebDispatcher,
    Router,
    send
} from 'routup';

const router = new Router();

router.get('/', () => 'Hello World');

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

| Name                                                                       | Description                                                            |
|----------------------------------------------------------------------------|------------------------------------------------------------------------|
| [body](https://www.npmjs.com/package/@routup/body)                         | Read and parse the request body.                                       |
| [cookie](https://www.npmjs.com/package/@routup/cookie)                     | Read and parse request cookies and serialize cookies for the response. |
| [decorators](https://www.npmjs.com/package/@routup/decorators)             | Create request handlers with class-, method- & parameter-decorators.   |
| [prometheus](https://www.npmjs.com/package/@routup/prometheus)             | Collect and serve metrics for prometheus.                              |
| [query](https://www.npmjs.com/package/@routup/query)                       | Read and parse the query string of the request url.                    |
| [rate-limit](https://www.npmjs.com/package/@routup/rate-limit)             | Rate limit incoming requests.                                          |
| [rate-limit-redis](https://www.npmjs.com/package/@routup/rate-limit-redis) | Redis adapter for the rate-limit plugin.                               |
| [static](https://www.npmjs.com/package/@routup/static)                     | Serve static files from a directory.                                   |
| [swagger](https://www.npmjs.com/package/@routup/swagger)                   | Serve generated docs from URL or based on a JSON file.                 |

## Benchmarks

* CPUs:  `24`
* RAM:  `63.9GB`
* Node: `v18.16.0`
* Date:  `Wed Sep 13 2023 15:11:58 GMT+0200 (Mitteleuropäische Sommerzeit) `
* Method: `autocannon -c 100 -d 40 -p 10 localhost:3000` (two rounds; one to warm-up, one to measure)

| Package    | Requests/s  |  Latency (ms) |   Throughput/MB |
|:-----------|:-----------:|--------------:|----------------:|
| http       |    61062    |         15.87 |           10.89 |
| fastify    |    59679    |         16.26 |           10.70 |
| koa        |    45763    |         21.35 |            8.16 |
| **routup** |    43881    |         22.29 |            8.87 |
| hapi       |    41374    |         23.67 |            7.38 |
| express    |    13376    |         74.18 |            2.39 |

Benchmarks were generated using autocannon. 
To recreate the results, this can be done using the [benchmarks'](https://github.com/routup/benchmarks) repository.
## Contributing

Before starting to work on a pull request, it is important to review the guidelines for
[contributing](./CONTRIBUTING.md) and the [code of conduct](./CODE_OF_CONDUCT.md).
These guidelines will help to ensure that contributions are made effectively and are accepted.

## License

Made with 💚

Published under [MIT License](./LICENSE).
