# @routup/query

[![npm version](https://badge.fury.io/js/@routup%2Fquery.svg)](https://badge.fury.io/js/@routup%2Fquery)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=CLIA667K6V)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

It is a plugin for reading and parsing the query string of the request url.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [License](#license)

## Installation

```bash
npm install @routup/query --save
```

## Documentation

To read the docs, visit [https://routup.tada5hi.net](https://routup.tada5hi.net)

## Usage

```typescript
import { Router, send } from 'routup';
import { 
    useRequestQuery
} from '@routup/query';

const router = new Router();

router.get('/', (req, res) => {
    const query = useRequestQuery(req);
    console.log(query);
    // { key: value, ... }

    send(res, 'Hello World');
});

router.listen(3000);
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
