# @routup/cookie

[![npm version](https://badge.fury.io/js/@routup%2Fcookie.svg)](https://badge.fury.io/js/@routup%2Fcookie)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=QFGCsHRUax)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a plugin for reading and parsing request cookies, as well serializing cookies for the
response.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [License](#license)

## Installation

```bash
npm install @routup/cookie --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

It is important to invoke the request middleware,
to parse the cookies of the request header.

```typescript
import {Router, send} from 'routup';
import {
    setResponseCookie,
    useRequestCookie,
    useRequestCookies
} from '@routup/cookie';

const router = new Router();

router.get('/', (req, res) => {
    const cookies = useRequestCookies(req);
    console.log(cookies);
    // { key: value, ... }

    const cookie = useRequestCookie(req, 'foo');
    console.log(cookie);
    // value

    setResponseCookie(res, 'foo', 'bar');

    send(res, 'Hello World');
});

router.listen(3000);
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
