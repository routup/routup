# Serving

In routup v5, the concept of "dispatchers" has been replaced by a unified serving API built on srvx.

## serve()

The primary way to start a server:

```typescript
import { Router, coreHandler, serve } from 'routup';

const router = new Router();
router.get('/', coreHandler(() => 'Hello, World!'));

serve(router, { port: 3000 });
```

## router.fetch()

Call `router.fetch()` directly with a `Request` to get a `Response`. Useful for testing or serverless environments:

```typescript
const router = new Router();
router.get('/', coreHandler(() => 'Hello'));

const response = await router.fetch(
    new Request('http://localhost/')
);
console.log(await response.text()); // "Hello"
```

## toNodeHandler()

For Node.js interop, convert a router to a standard `(req, res)` handler:

```typescript
import { createServer } from 'node:http';
import { Router, coreHandler } from 'routup';
import { toNodeHandler } from 'routup/node';

const router = new Router();
router.get('/', coreHandler(() => 'Hello'));

const server = createServer(toNodeHandler(router));
server.listen(3000);
```

See [Runtime Environments](./runtime-environments.md) for runtime-specific examples.
