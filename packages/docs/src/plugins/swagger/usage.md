# Usage

## Generator

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


## UI

Serve generated docs from (file- / web-) URL or based on a JSON file with [swagger-ui](https://www.npmjs.com/package/swagger-ui-dist).

```typescript
import { Router } from 'routup';
import { createUIHandler } from '@routup/swagger';

const router = new Router();

router.use('/docs', createUIHandler('test/data/swagger.json'));

router.listen(3000);
```
