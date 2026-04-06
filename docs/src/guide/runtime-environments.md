# Runtime Environments

Routup runs on any JavaScript runtime via [srvx](https://srvx.unjs.io/). Import from `routup` — the correct runtime entry is selected automatically via conditional exports.

```typescript
import { Router, coreHandler, serve } from 'routup';

const router = new Router();
router.get('/', coreHandler(() => 'Hello'));

serve(router, { port: 3000 });
```

This works on Node.js, Bun, Deno, and any runtime that supports conditional exports.

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
