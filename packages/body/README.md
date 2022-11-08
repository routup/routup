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
- [Handler](#handler)
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
import { createRequestHandler } from '@routup/body';

const router = new Router();
// This will parse requests with Content-Type:
// application/json
// application/x-www-form-urlencoded
router.use(createRequestHandler());

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```

## Handler

Besides using the `createRequestHandler` method, it is also possible to register a specific handler
as middleware.

### Json

To parse `application/json` input data, mount the json handler to the router instance.

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestJsonHandler } from '@routup/body';

const router = new Router();
router.use(createRequestJsonHandler());

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```

### UrlEncoded

To parse `application/x-www-form-urlencoded` input data, mount the url-encoded handler to the router instance.

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestUrlEncodedHandler } from '@routup/body';

const router = new Router();
router.use(createRequestUrlEncodedHandler({ extended: false }));

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```

### Raw

To parse `any` input data as Buffer, mount the raw handler to the router instance.

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestRawHandler } from '@routup/body';

const router = new Router();
router.use(createRequestRawHandler());

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```

### Text

To parse `any` input data as string, mount the text handler to the router instance.

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestTextHandler } from '@routup/body';

const router = new Router();
router.use(createRequestTextHandler({ type: 'text/html' }));

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
