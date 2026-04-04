# Express Compatibility

Routup provides `fromNodeHandler()` to wrap existing Express or Connect middleware for use in routup.

## fromNodeHandler()

Wrap a Node.js `(req, res)` or `(req, res, next)` middleware:

```typescript
import { Router, coreHandler } from 'routup';
import { fromNodeHandler } from 'routup/node';
import cors from 'cors';

const router = new Router();

router.use(fromNodeHandler(cors()));
```

This works with any Express-compatible middleware:

```typescript
import helmet from 'helmet';
import compression from 'compression';

router.use(fromNodeHandler(helmet()));
router.use(fromNodeHandler(compression()));
```

## How it Works

`fromNodeHandler()` takes a standard Node.js handler function and wraps it as a routup handler. The wrapper:

1. Converts the routup `DispatchEvent` into Node.js `req`/`res` objects
2. Calls the middleware with those objects
3. Bridges the `next()` callback back into routup's pipeline

This makes it straightforward to migrate from Express incrementally or reuse the existing middleware ecosystem.
