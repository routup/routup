# Express Compatibility

Routup provides `fromNodeHandler()` and `fromNodeMiddleware()` to wrap existing Express or Connect middleware for use in routup.

## fromNodeMiddleware()

Wrap a Node.js `(req, res, next)` middleware. The `next()` callback is bridged back into routup's pipeline:

```typescript
import { App, fromNodeMiddleware } from 'routup';
import cors from 'cors';

const app = new App();

app.use(fromNodeMiddleware(cors()));
```

This works with any Express-compatible middleware:

```typescript
import helmet from 'helmet';
import compression from 'compression';

app.use(fromNodeMiddleware(helmet()));
app.use(fromNodeMiddleware(compression()));
```

## fromNodeHandler()

Wrap a Node.js `(req, res)` handler (without a `next` callback). If the handler writes a response, it is detected and the pipeline stops:

```typescript
import { fromNodeHandler } from 'routup';

app.use(fromNodeHandler((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from Node.js handler');
}));
```

## How it Works

Both `fromNodeHandler()` and `fromNodeMiddleware()` access the underlying Node.js `IncomingMessage` and `ServerResponse` from the runtime context. They need a Node.js server that sets `event.request.runtime.node`: `serve()` on Node.js, or `toNodeHandler()` from `routup/node` passed to `createServer()` of `node:http`.

Called through `app.fetch()` with a plain `Request`, the wrapper throws an `AppError` and the request answers 500. To test an app that uses them, start a `node:http` server with `toNodeHandler(app)` and send requests to it.

The wrapper:

1. Extracts the Node.js `req`/`res` objects from `event.request.runtime.node`
2. Calls the middleware/handler with those objects
3. For `fromNodeMiddleware()`, bridges the `next()` callback back into routup's pipeline
4. Detects when the response has been fully written (via `finish`/`close` events)

This makes it straightforward to migrate from Express incrementally or reuse the existing middleware ecosystem.

## Limitations

- Needs a Node.js server that sets `event.request.runtime.node`; under `app.fetch()` with a plain `Request` the request answers 500
- Middleware that depends on Express-specific extensions (e.g., `req.app`, `req.baseUrl`) may not work without modification
