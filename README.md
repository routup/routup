# sapir 🚌

[![npm version](https://badge.fury.io/js/sapir.svg)](https://badge.fury.io/js/sapir)
[![main](https://github.com/Tada5hi/sapir/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/sapir/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/sapir/branch/master/graph/badge.svg?token=QFGCsHRUax)](https://codecov.io/gh/tada5hi/sapir)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/sapir/badge.svg)](https://snyk.io/test/github/Tada5hi/sapir)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

Sapir (**S**imple **Api** **R**outer) is a minimalistic http based routing framework.
It uses node's vanilla request and response interfaces, which are injected into route- & middleware-handlers as function argument.
Helpers provide additional functionalities to transform and interact with the request and manipulate the response upstream.

> **Note**
> The package is still in heavy development and is therefore not production ready.
> Besides, the README.md is missing important parts, which are not covered yet. 

**Table of Contents**

- [Installation](#installation)
- [Features](#features)
- [Usage](#usage)
- [Plugins](#plugins)
- [Middlewares](#middlewares)
- [License](#license)

## Installation

```bash
npm install sapir --save
```

## Features

- 🚀 high performance routing
- 🧰 response & request helpers/utilities
- 💼 extendable & compact
- 🛫 named route parameters
- 📁 nestable routers
- 😌 define one or many (error-) middlewares
- ✨ promise support for route- & middleware-handlers
- 👕 TypeScript fully supported
- 🤏 Minimalistic to fit into any solution with minimum overhead
- & much more

## Usage

A router is an object containing route-, router- & middleware- instances, which are composed and executed
in a stack-like manner upon request.

```typescript
import { Router, send } from 'sapir';

const router = new Router();

router.get('/', (req, res) => {
    send(res, 'Hello World');
});

router.listen(3000);
```

It is not a 1-to-1 representation of an HTTP server. 
Multiple routers may be mounted together to form larger applications with a single HTTP server.

```typescript
import { Router, send } from 'sapir';

const child = new Router();

child.get('/', (req, res) => {
    send(res, 'Hello World');
});

const router = new Router();
router.use(childRouter);
router.listen(3000);
```

The `.listen(...)` method is sugar for the following:
```typescript
import { createServer } from 'http';
import { Router, send } from 'sapir';

const router = new Router();

createServer(router.createListener()).listen(3000);
```

The `.use(...)` method can be used to inject router- or middleware-handlers to the current router instance.
```typescript
import { Router, send } from 'sapir';

const router = new Router();
router.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${Date.now()}`);
    
    next();
})

router.listen(3000);
```

## Plugins

Due the fact that SAPIR is a minimalistic framework, it depends on plugins to cover some 
typically http framework functions, which are not integrated in the main package.

| Name                      | Description                                    |
|---------------------------|------------------------------------------------|
| [cookie](packages/cookie) | Read and use cookies set in the request header |
| [query](packages/query)   | Parse and use url query string                 |


## Middlewares

Middlewares can be injected by using the `use()` method of a router instance.

```typescript
import { Router } from 'sapir';

const router = new Router();

const middleware = (req, res, next) => {
    console.log('My amazing middleware 🥳');
    next();
};

router.use(middleware);
```

> **Note**
> Express middleware libraries (like body-parser, multer, ...) should work out of the box 🔥.

## License

Made with 💚

Published under [MIT License](./LICENSE).
