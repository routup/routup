# Runtime Environments

App runs on any JavaScript runtime that supports Web standard `Request` and `Response`. Import from `routup` — the correct runtime entry is selected automatically via conditional exports.

```typescript
import { App, defineCoreHandler, serve } from 'routup';

const app = new App();
app.get('/', defineCoreHandler(() => 'Hello'));

serve(app, { port: 3000 });
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
