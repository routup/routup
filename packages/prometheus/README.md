# @routup/prometheus

[![npm version](https://badge.fury.io/js/@routup%2Fprometheus.svg)](https://badge.fury.io/js/@routup%2Fprometheus)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=CLIA667K6V)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a routup plugin to collect and serve metrics for prometheus.

It provides two built-in metrics: 
- `uptime`: This metric provides information about the total uptime of the http server.
- `requestDuration`: This metric provides information about the duration of incoming requests.

The plugin is based on the [prom-client](https://www.npmjs.com/package/prom-client) library.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [License](#license)

## Installation

```bash
npm install @routup/prometheus --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

The metrics collected in the following example, can be inspected on: 
http://localhost:3000/metrics

The `registerMetrics` method, should be called before registering any routes!

```typescript
import { Router } from 'routup';
import {
    registerMetrics,
    createHandler
} from '@routup/prometheus';

const router = new Router();

// register 'uptime' & 'requestDuration' metrics
registerMetrics(router);

// serve metrics
router.use('/metrics', createHandler());

router.listen(3000);
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
