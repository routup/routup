# Plugins

Routup is minimalistic by design. Plugins extend the framework with additional functionality that is not part of the core.

A plugin is an object with a `name` and an `install` method that receives the router instance.

## Mounting

Mount a plugin globally:

```typescript
router.use(myPlugin({ /* options */ }));
```

Mount a plugin on a specific path:

```typescript
router.use('/api', myPlugin({ /* options */ }));
```

## Writing a Plugin

Define a plugin as a factory function that returns a `Plugin` object:

```typescript
import { defineCoreHandler } from 'routup';
import type { Plugin } from 'routup';

export type Options = {
    path?: string;
};

export function myPlugin(options: Options = {}): Plugin {
    const path = options.path || '/hello';

    return {
        name: 'myPlugin',
        install: (router) => {
            router.get(path, defineCoreHandler((event) => {
                return 'Hello from plugin!';
            }));
        }
    };
}
```

## Using a Plugin

```typescript
import { Router } from 'routup';
import { myPlugin } from '@routup/my-plugin';

const router = new Router();

router.use(myPlugin({ path: '/hello' }));
```

## Ecosystem

Official plugins are available at [GitHub](https://github.com/routup/plugins).

| Name | Description |
|------|-------------|
| [assets](https://github.com/routup/plugins/tree/master/packages/assets/) | Serve static files from a directory |
| [basic](https://github.com/routup/plugins/tree/master/packages/basic/) | Bundle of body, cookie, and query plugins |
| [body](https://github.com/routup/plugins/tree/master/packages/body/) | Read and parse the request body |
| [cookie](https://github.com/routup/plugins/tree/master/packages/cookie/) | Read/write cookies |
| [decorators](https://github.com/routup/plugins/tree/master/packages/decorators/) | Class, method, and parameter decorators |
| [prometheus](https://github.com/routup/plugins/tree/master/packages/prometheus/) | Collect and serve Prometheus metrics |
| [query](https://github.com/routup/plugins/tree/master/packages/query/) | Parse URL query strings |
| [rate-limit](https://github.com/routup/plugins/tree/master/packages/rate-limit/) | Rate limit incoming requests |
| [rate-limit-redis](https://github.com/routup/plugins/tree/master/packages/rate-limit-redis/) | Redis adapter for rate-limit |
| [swagger](https://github.com/routup/plugins/tree/master/packages/swagger) | Serve Swagger/OpenAPI docs |
