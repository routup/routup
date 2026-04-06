# Express Compatibility

Routup provides `fromNodeHandler()` and `fromNodeMiddleware()` to wrap existing Express or Connect middleware for use in routup.

## fromNodeMiddleware()

Wrap a Node.js `(req, res, next)` middleware. The `next()` callback is bridged back into routup's pipeline:

```typescript
import { Router, fromNodeMiddleware } from 'routup';
import cors from 'cors';

const router = new Router();

router.use(fromNodeMiddleware(cors()));
```

This works with any Express-compatible middleware:

```typescript
import helmet from 'helmet';
import compression from 'compression';

router.use(fromNodeMiddleware(helmet()));
router.use(fromNodeMiddleware(compression()));
```

## fromNodeHandler()

Wrap a Node.js `(req, res)` handler (without a `next` callback). If the handler writes a response, it is detected and the pipeline stops:

```typescript
import { fromNodeHandler } from 'routup';

router.use(fromNodeHandler((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from Node.js handler');
}));
```

## How it Works

Both `fromNodeHandler()` and `fromNodeMiddleware()` access the underlying Node.js `IncomingMessage` and `ServerResponse` from the srvx runtime context. This means they only work when running on the Node.js runtime (i.e., when imported from `routup/node`).

The wrapper:

1. Extracts the Node.js `req`/`res` objects from `event.request.runtime.node`
2. Calls the middleware/handler with those objects
3. For `fromNodeMiddleware()`, bridges the `next()` callback back into routup's pipeline
4. Detects when the response has been fully written (via `finish`/`close` events)

This makes it straightforward to migrate from Express incrementally or reuse the existing middleware ecosystem.

## Limitations

- Only works on Node.js (requires `event.request.runtime.node` from srvx)
- Middleware that depends on Express-specific extensions (e.g., `req.app`, `req.baseUrl`) may not work without modification
