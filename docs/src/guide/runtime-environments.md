# Runtime Environments

Routup runs on any JavaScript runtime via [srvx](https://srvx.unjs.io/). Import from `routup` — the correct runtime entry is selected automatically via conditional exports.

```typescript
import { Router, coreHandler, serve } from 'routup';

const router = new Router();
router.get('/', coreHandler(() => 'Hello'));

serve(router, { port: 3000 });
```

This works on Node.js, Bun, Deno, and any runtime that supports conditional exports.

## Node.js Interop

If you need a raw Node.js `(req, res)` handler for `http.createServer` or Express integration, use `toNodeHandler()`:

```typescript
import { toNodeHandler } from 'routup';

const handler = toNodeHandler(router);
http.createServer(handler).listen(3000);
```

## Cloudflare Workers

Cloudflare Workers use a default export pattern:

```typescript
import { Router, coreHandler, serve } from 'routup';

const router = new Router();
router.get('/', coreHandler(() => 'Hello from Cloudflare'));

export default serve(router);
```

## Direct Fetch

In any environment, you can use `router.fetch()` directly with a Web `Request`:

```typescript
const response = await router.fetch(new Request('http://localhost/'));
```

This is useful for serverless environments, testing, and integration with frameworks that expect a fetch-compatible handler.

## Explicit Entry Points

For runtimes without conditional export support, explicit entry points are available:

| Import | Runtime |
|--------|---------|
| `routup/node` | Node.js |
| `routup/bun` | Bun |
| `routup/deno` | Deno |
| `routup/cloudflare` | Cloudflare Workers |
| `routup/service-worker` | Service Workers |
| `routup/generic` | Generic Web API |
