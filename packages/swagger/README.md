# @routup/swagger

[![npm version](https://badge.fury.io/js/@routup%2Fswagger.svg)](https://badge.fury.io/js/@routup%2Fswagger)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=QFGCsHRUax)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a plugin for reading and parsing the request payload.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
  - [Generator](#generator) 
  - [UI](#ui)
- [License](#license)

## Installation

```bash
npm install @routup/swagger --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

### Generator

Generate a swagger document for the API endpoints.

**`V2`**

```typescript
import { generate, Version } from '@routup/swager';
import process from 'node:process';

await generate({
    version: Version.V2,
    options: {
        metadata: {
            preset: '@routup/swagger-preset',
            entryPoint: {
                cwd: process.cwd(),
                pattern: '**/*.ts',
            },
        },
        output: true,
        outputDirectory: 'writable',
        servers: ['http://localhost:3000/'],
    },
});
```

The function call will save the file under the location: `./writable/swagger.json`.

**`V3`**

```typescript
import { generate, Version } from '@routup/swager';
import process from 'node:process';

await generate({
    version: Version.V3,
    options: {
        metadata: {
            preset: '@routup/swagger-preset',
            entryPoint: {
                cwd: process.cwd(),
                pattern: '**/*.ts',
            },
        },
        output: true,
        outputDirectory: 'writable',
        servers: ['http://localhost:3000/'],
    },
});
```

The function call will save the file under the location: `./writable/swagger.json`.

### UI

Serve generated docs from (file- / web-) URL or based on a JSON file with [swagger-ui](https://www.npmjs.com/package/swagger-ui-dist).

```typescript
import { Router } from 'routup';
import { createUIHandler } from '@routup/swagger';

const router = new Router();

router.use('/docs', createUIHandler('test/data/swagger.json'));

router.listen(3000);
```

Now open the browser and visit:

`http://localhost:3000/docs/`

## License

Made with 💚

Published under [MIT License](./LICENSE).
