# @routup/body

[![npm version](https://badge.fury.io/js/@routup%2Fbody.svg)](https://badge.fury.io/js/@routup%2Fbody)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=QFGCsHRUax)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a plugin for reading and parsing the request payload.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [Parser](#parser)
  - [Json](#json)
  - [UrlEncoded](#urlencoded)
  - [Raw](#raw)
  - [Text](#text)
- [Credits](#credits)
- [License](#license)

## Installation

```bash
npm install @routup/body --save
```

## Documentation

To read the docs, visit [https://routup.tada5hi.net](https://routup.tada5hi.net)

## Usage

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestParser } from '@routup/body';

const router = new Router();
// This will parse requests with Content-Type:
// application/json
// application/x-www-form-urlencoded
router.use(createRequestParser());

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```

## Parser

Besides using the `createRequestParser` method, it is also possible to register a specific parser
as middleware.

### Json

To parse `application/json` input data, mount the json parser to the router instance.

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestJsonParser } from '@routup/body';

const router = new Router();
router.use(createRequestJsonParser());

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```

### UrlEncoded

To parse `application/x-www-form-urlencoded` input data, mount the url-encoded parser to the router instance.

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestUrlEncodedParser } from '@routup/body';

const router = new Router();
router.use(createRequestUrlEncodedParser({ extended: false }));

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```

### Raw

To parse `any` input data as Buffer, mount the raw parser to the router instance.

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestRawParser } from '@routup/body';

const router = new Router();
router.use(createRequestRawParser());

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```

### Text

To parse `any` input data as string, mount the text parser to the router instance.

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestTextParser } from '@routup/body';

const router = new Router();
router.use(createRequestTextParser({ type: 'text/html' }));

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```

## Credits

This library is currently based on the [body-parser](https://www.npmjs.com/package/body-parser) library,
but this might change in the near future.

## License

Made with 💚

Published under [MIT License](./LICENSE).
