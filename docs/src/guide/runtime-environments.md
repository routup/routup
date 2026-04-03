# Runtime Environments

It is possible to use Routup in any javascript runtime environment. Below are examples for Node.Js, Bun and Deno.
There are different [dispatchers](dispatchers.md) how requests can be transmitted in different ways.

## Node

```typescript
import { createServer } from 'node:http';
import {
    createNodeDispatcher,
    coreHandler,
    Router
} from 'routup';

const router = new Router();

router.get('/', coreHandler(() => 'Hello World'));

const server = createServer(createNodeDispatcher(router));
server.listen(3000)
```

## Bun

```typescript
import {
    createWebDispatcher,
    coreHandler,
    Router
} from 'routup';

const router = new Router();

router.get('/', coreHandler(() => 'Hello World'));

const dispatch = createWebDispatcher(router);

Bun.serve({
    async fetch(request) {
        return dispatch(request);
    },
    port: 3000,
});
```

## Deno

```typescript
import {
    createWebDispatcher,
    coreHandler,
    Router
} from 'routup';

const router = new Router();

router.get('/', coreHandler(() => 'Hello World'));

const dispatch = createWebDispatcher(router);

const server = Deno.listen({
    port: 3000
});
for await (const conn of server) {
    const httpConn = Deno.serveHttp(conn);

    for await (const requestEvent of httpConn) {
        const response = await dispatch(
            requestEvent.request
        );
        requestEvent.respondWith(response);
    }
}
```
