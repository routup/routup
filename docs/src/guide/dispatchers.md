# Serving

Routup provides multiple ways to serve your application, all built on Web standard APIs for cross-runtime compatibility.

## serve()

The primary way to start a server. Import from a runtime-specific entry point:

```typescript
import { App, defineCoreHandler, serve } from 'routup';

const app = new App();
app.get('/', defineCoreHandler(() => 'Hello, World!'));

serve(app, { port: 3000 });
```

The `serve()` function accepts standard server options (port, hostname, etc.).

## app.fetch()

Call `app.fetch()` directly with a `Request` to get a `Response`. Useful for testing or serverless environments:

```typescript
const app = new App();
app.get('/', defineCoreHandler(() => 'Hello'));

const response = await app.fetch(
    new Request('http://localhost/')
);
console.log(await response.text()); // "Hello"
```

## toNodeHandler()

For Node.js interop, convert a router to a standard `(req, res)` handler. Available from the `routup/node` entry point:

```typescript
import { createServer } from 'node:http';
import { App, defineCoreHandler, toNodeHandler } from 'routup/node';

const app = new App();
app.get('/', defineCoreHandler(() => 'Hello'));

const server = createServer(toNodeHandler(app));
server.listen(3000);
```

This is useful for integrating routup into existing Node.js applications, or using it with frameworks like Express as a sub-app.

See [Runtime Environments](./runtime-environments.md) for runtime-specific examples.
