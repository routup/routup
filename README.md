# SAPIR 🚌

[![npm version](https://badge.fury.io/js/sapir.svg)](https://badge.fury.io/js/sapir)
[![main](https://github.com/Tada5hi/sapir/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/sapir/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/sapir/branch/master/graph/badge.svg?token=QFGCsHRUax)](https://codecov.io/gh/tada5hi/sapir)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/sapir/badge.svg)](https://snyk.io/test/github/Tada5hi/sapir)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

SAPIR (**S**imple **API** **R**outer) is a minimalistic http based routing framework.
It uses node's vanilla request and response interfaces, which are injected into route- & middleware-handlers as function argument.
Helpers provide additional functionalities to transform and interact with the request and manipulate the response upstream.

> **Note**
> The package is still in heavy development and is therefore not production ready.
> Besides, the README.md is missing important parts, which are not covered yet. 

**Table of Contents**

- [Installation](#installation)
- [Features](#features)
- [Documentation](#documentation)
- [Usage](#usage)
- [Plugins](#plugins)
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

## Documentation

To read the docs, visit [https://sapir.tada5hi.net](https://sapir.tada5hi.net)

## Usage

```typescript
import { Router, send } from 'sapir';

const router = new Router();

router.get('/', (req, res) => {
    send(res, 'Hello World');
});

router.listen(3000);
```

## Plugins

According to the fact that SAPIR is a minimalistic framework, it depends on plugins to cover some 
typically http framework functions, which are not integrated in the main package.

| Name                      | Description                                    |
|---------------------------|------------------------------------------------|
| [cookie](packages/cookie) | Read and use cookies set in the request header |
| [query](packages/query)   | Parse and use url query string                 |


## License

Made with 💚

Published under [MIT License](./LICENSE).
