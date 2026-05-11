# Serving

Routup provides multiple ways to serve your application, all built on Web standard APIs for cross-runtime compatibility.

## serve()

The primary way to start a server. Import from a runtime-specific entry point:

```typescript
import { Router, defineCoreHandler, serve } from 'routup';

const router = new Router();
router.get('/', defineCoreHandler(() => 'Hello, World!'));

serve(router, { port: 3000 });
```

The `serve()` function accepts standard server options (port, hostname, etc.).

## router.fetch()

Call `router.fetch()` directly with a `Request` to get a `Response`. Useful for testing or serverless environments:

```typescript
const router = new Router();
router.get('/', defineCoreHandler(() => 'Hello'));

const response = await router.fetch(
    new Request('http://localhost/')
);
console.log(await response.text()); // "Hello"
```

## toNodeHandler()

For Node.js interop, convert a router to a standard `(req, res)` handler. Available from the `routup/node` entry point:

```typescript
import { createServer } from 'node:http';
import { Router, defineCoreHandler, toNodeHandler } from 'routup/node';

const router = new Router();
router.get('/', defineCoreHandler(() => 'Hello'));

const server = createServer(toNodeHandler(router));
server.listen(3000);
```

This is useful for integrating routup into existing Node.js applications, or using it with frameworks like Express as a sub-app.

See [Runtime Environments](./runtime-environments.md) for runtime-specific examples.
