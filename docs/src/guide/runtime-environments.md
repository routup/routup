# Runtime Environments

Routup runs on any JavaScript runtime via srvx. Each runtime has its own entry point that provides the `serve()` function alongside all core exports.

## Import Paths

| Import | Runtime |
|--------|---------|
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

If you need a raw Node.js `(req, res)` handler (e.g., for `http.createServer` or Express integration):

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

## Generic Web API

For any runtime that supports the Web Fetch API:

```typescript
import { Router, coreHandler, serve } from 'routup/generic';

const router = new Router();
router.get('/', coreHandler(() => 'Hello'));

serve(router, { port: 3000 });
```

## Direct Fetch

In any environment, you can use `router.fetch()` directly with a Web `Request`:

```typescript
import { Router, coreHandler } from 'routup';

const router = new Router();
router.get('/', coreHandler(() => 'Hello'));

const response = await router.fetch(new Request('http://localhost/'));
console.log(await response.text()); // "Hello"
```

This is useful for serverless environments, testing, and integration with frameworks that expect a fetch-compatible handler.
