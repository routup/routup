# @routup/static

[![npm version](https://badge.fury.io/js/@routup%2Fstatic.svg)](https://badge.fury.io/js/@routup%2Fstatic)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=CLIA667K6V)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a plugin for serving static files from a specified directory.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
  - [Multiple Directories](#multiple-directories)
  - [Mount Path](#mount-path)
- [API](#api)
  - [Options](#options)
- [License](#license)

## Installation

```bash
npm install @routup/static --save
```

## Documentation

To read the docs, visit [https://routup.tada5hi.net](https://routup.tada5hi.net)

## Usage

Create a new middleware function to serve files from within a given directory.
When a file is not found, instead of sending a 404 response, this module will instead call `next()` 
to move on to the next middleware, allowing for stacking and fall-backs.

```typescript
import {Router, send} from 'routup';
import {
    createHandler
} from '@routup/static';

const router = new Router();

// serve static files of folder: public
router.use(createHandler('public'));

router.listen(3000);
```

### Multiple Directories

Sometimes it may be necessary to serve static files from multiple directories. 
To accomplish this, this plugin can be used multiple times.
An example of this is shown below:

```typescript
import {Router, send} from 'routup';
import {
    createHandler
} from '@routup/static';

const router = new Router();

router.use(createHandler('public'));
router.use(createHandler('files'));

router.listen(3000);
```

This will allow to serve files from the `public` and the `files` directories. 
When a request for a file is made, those in the `public` directory will be checked before those in the `files` directory.
If a file with the same name exists in both directories, the one in the `public` directory will be served.

### Mount Path

It is also possible to define a mount path for a root directory. 
This is done as follows:

```typescript
import {Router, send} from 'routup';
import {
    createHandler
} from '@routup/static';

const router = new Router();

router.use('/public', createHandler('public'));

router.listen(3000);
```

With this setup, requests for files in the `public` directory must start with `/public`.

## API

### Options

The `createHandler` function takes an optional options object. The available options are:

#### scan
- Type: `Boolean`<br />
- Default: `true`
- Description:
Define if the metadata of given files in the directory should be preloaded. The advantage here is,
that the filesystem must not be traversed on every request.

#### cacheMaxAge
- Type: `Number`<br />
- Default: `0`
- Description: 
Set the `max-age` (in seconds) directive of the cache-control header.

#### cacheImmutable
- Type: `Boolean`<br />
- Default: `false`
- Description:
Append the `immutable` directive to the cache-control header.

#### fallback
- Type: `Boolean|String`<br />
- Default: `false`
- Description: 
Resolve files, which are not found to a specific directory (default: '/')

#### fallbackIgnores
- Type: `RegExp[]`
- Default: `[]`
- Description:
Specify paths/patterns that should not be forwarded to the fallback path.

#### fallthrough
- Type: `Boolean`<br />
- Default: `true`
- Description:
Pass the request to the next handler, if no file was found and the fallback strategy is disabled.

#### extensions
- Type: `String[]`
- Default: `['html', 'htm']`
- Description: 
Set file extension fallbacks.
When set, if a file is not found, the middleware will search for files with the specified extensions and serve the first one that exists.

#### dotFiles
- Type: `Boolean`
- Default: `false`
- Description:
Determines how to treat dotfiles (files or directories beginning with a `.`).

#### ignores
- Type: `RegExp[]`
- Default: `[]`
- Description:
  Specify paths/patterns that should not be served.

## License

Made with 💚

Published under [MIT License](./LICENSE).
