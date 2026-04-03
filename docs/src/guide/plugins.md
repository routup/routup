# Plugins

According to the fact that routup is a minimalistic framework, it depends on plugins to cover some
typically http framework functions, which are not integrated in the main package.

At its core, a plugin is an object with the properties **install** and **name** property. It should be
distributed as package which exports a function that can be called with plugin specific
options and returns such an object.

Plugins allow to interact with the router instance. Thus, it is possible to register additional handlers or customize the behavior.

The officially provided plugins can be viewed via [GitHub](https://github.com/routup/plugins). If you would like to make a suggestion for an official plugin, please submit a pull request.

## Ecosystem

List of official plugins.

| Name                                                                                         | Description                                                            |
|----------------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| [assets](https://github.com/routup/plugins/tree/master/packages/assets/)                     | Serve static files from a directory.                                   |
| [basic](https://github.com/routup/plugins/tree/master/packages/basic/)                       | Bundle of the body, cookie and query plugin.                           |
| [body](https://github.com/routup/plugins/tree/master/packages/body/)                         | Read and parse the request body.                                       |
| [cookie](https://github.com/routup/plugins/tree/master/packages/cookie/)                     | Read and parse request cookies and serialize cookies for the response. |
| [decorators](https://github.com/routup/plugins/tree/master/packages/decorators/)             | Create request handlers with class-, method- & parameter-decorators.   |
| [prometheus](https://github.com/routup/plugins/tree/master/packages/prometheus/)             | Collect and serve metrics for prometheus.                              |
| [query](https://github.com/routup/plugins/tree/master/packages/query/)                       | Read and parse the query string of the request url.                    |
| [rate-limit](https://github.com/routup/plugins/tree/master/packages/rate-limit/)             | Rate limit incoming requests.                                          |
| [rate-limit-redis](https://github.com/routup/plugins/tree/master/packages/rate-limit-redis/) | Redis adapter for the rate-limit plugin.                               |
| [swagger](https://github.com/routup/plugins/tree/master/packages/swagger)                    | Serve generated docs from URL or based on a JSON file.                 |

## Mounting

Mount a plugin without any specific criteria, making it available to process requests regardless of path.

```typescript
router.use(myPlugin({ /* ... */ }));
```

Mount a plugin on a specific path `/plugin`.

```typescript
router.use('/plugin', myPlugin({ /* ... */ }));
```

## Example

### Definition

Define a plugin `@routup/my-plugin`.

```typescript
import { coreHandler, setRequestEnv, useRequestEnv } from 'routup';
import type { Plugin } from 'routup';

export type Options = {
    path?: string
}

export function myPlugin(options: Options = {}) : Plugin {
    const path = options.path || '/hello-world';
    
    return {
        name: 'myPlugin',
        install: (router) => {
            router.use(coreHandler((req) => {
                setRequestEnv(req, 'name', 'World');
            }));
            
            router.get(path, () => `Hello, ${useRequestEnv(req, 'name')}!`)
        }
    }
}
```

### Mounting

To install the plugin, mount it to the router.

```typescript
import { myPlugin } from '@routup/my-plugin';
import { Router } from 'routup';

const router = new Router();

router.use(myPlugin({ path: '/hello-world' }));
```
