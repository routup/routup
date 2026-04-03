# Runtime Environments

Routup runs on any JavaScript runtime via srvx. Import from `routup` to auto-select the runtime, or use a runtime-specific import path.

## Import Paths

| Import | Runtime |
|--------|---------|
| `routup` | Auto-selects based on environment |
| `routup/node` | Node.js |
| `routup/bun` | Bun |
| `routup/deno` | Deno |
| `routup/cloudflare` | Cloudflare Workers |
| `routup/service-worker` | Service Workers |
| `routup/generic` | Generic Web API runtime |

## Node.js

```typescript
import { Router, coreHandler, serve } from 'routup/node';

const router = new Router();
router.get('/', coreHandler(() => 'Hello from Node.js'));

serve(router, { port: 3000 });
```

If you need a raw Node.js `(req, res)` handler (e.g. for `http.createServer` or Express integration):

```typescript
import { toNodeHandler } from 'routup/node';

const handler = toNodeHandler(router);
http.createServer(handler).listen(3000);
```

## Bun

```typescript
import { Router, coreHandler, serve } from 'routup/bun';

const router = new Router();
router.get('/', coreHandler(() => 'Hello from Bun'));

serve(router, { port: 3000 });
```

## Deno

```typescript
import { Router, coreHandler, serve } from 'routup/deno';

const router = new Router();
router.get('/', coreHandler(() => 'Hello from Deno'));

serve(router, { port: 3000 });
```

## Cloudflare Workers

```typescript
import { Router, coreHandler, serve } from 'routup/cloudflare';

const router = new Router();
router.get('/', coreHandler(() => 'Hello from Cloudflare'));

export default serve(router);
```

## Auto-detection

When you import from `routup`, the runtime is auto-selected via conditional exports in `package.json`. This is the recommended approach for libraries and portable code:

```typescript
import { Router, coreHandler, serve } from 'routup';

const router = new Router();
router.get('/', coreHandler(() => 'Hello'));

serve(router, { port: 3000 });
```
