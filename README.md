# routup 🧙‍

[![npm version](https://badge.fury.io/js/routup.svg)](https://badge.fury.io/js/routup)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=CLIA667K6V)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

**Routup** is a lightweight and extendable http interface based routing framework.
It uses node's vanilla request and response interfaces, which are injected into route handlers aka middlewares as function argument.

Helpers provide additional functionalities to transform and interact with the request and manipulate the response upstream.

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

## Documentation

To read the docs, visit [https://routup.tada5hi.net](https://routup.tada5hi.net)

## Usage

```typescript
import { Router, send } from 'routup';

const router = new Router();

router.get('/', (req, res) => {
    send(res, 'Hello World');
});

router.listen(3000);
```

## Plugins

According to the fact that routup is a minimalistic framework, it depends on plugins to cover some 
typically http framework functions, which are not integrated in the main package.

| Name                              | Description                                                            |
|-----------------------------------|------------------------------------------------------------------------|
| [body](packages/body)             | Read and parse the request body.                                       |
| [cookie](packages/cookie)         | Read and parse request cookies and serialize cookies for the response. |
| [decorators](packages/decorators) | Create request handlers with class-, method- & parameter-decorators.   |
| [query](packages/query)           | Read and parse the query string of the request url.                    |
| [swagger](packages/swagger)       | Serve generated docs from URL or based on a JSON file.                 |

## Contributing

Before starting to work on a pull request, it is important to review the guidelines for
[contributing](./CONTRIBUTING.md) and the [code of conduct](./CODE_OF_CONDUCT.md).
These guidelines will help to ensure that contributions are made effectively and are accepted.

## License

Made with 💚

Published under [MIT License](./LICENSE).
