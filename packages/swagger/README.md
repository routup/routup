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
  - [UI](#ui)
- [License](#license)

## Installation

```bash
npm install @routup/swagger --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

### UI

Serve generated docs from URL or based on a JSON file with [swagger-ui](https://www.npmjs.com/package/swagger-ui-dist).

```typescript
import fs from 'fs';
import path from 'path';
import { Router } from 'routup';
import { createUIHandler } from '@routup/swagger';

const router = new Router();

const docStr = fs.readFileSync(
    path.resolve(__dirname, '..', 'test', 'data', 'swagger.json'), 
    {
        encoding: 'utf-8',
    }
);
const doc = JSON.parse(docStr);

router.use('/docs', createUIHandler(doc));

router.listen(3000);
```

Now open the browser and visit:

`http://localhost:3000/docs/`

## License

Made with 💚

Published under [MIT License](./LICENSE).
