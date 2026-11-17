# Runtime Environments

An app only handles Web `Request` and `Response` objects, so the same `app.ts` runs on every runtime. What differs is the file that starts it and the command that runs that file.

## The Bare `routup` Import

`import { serve } from 'routup'` works on every runtime. It picks an [entry](/guide/installation#entry-points) through the conditions of `exports["."]` in routup's `package.json`: a runtime takes the first listed condition it matches. The order is `node`, `bun`, `deno`, `workerd`, `default`, which gives today:

| Runtime | Entry the bare import loads |
|---------|-----------------------------|
| Node.js | `routup/node` |
| Bun | `routup/node` (Bun also matches `node`, which is listed before `bun`) |
| Deno | `routup/node` (Deno also matches `node`, which is listed before `deno`) |
| Cloudflare Workers (Wrangler) | `routup/cloudflare` |
| A runtime that matches none of these | `routup/generic` |

Import from a runtime's own entry to get its native server, or when code relies on what one entry exports, such as `toNodeHandler` from `routup/node`.

## Node.js

```typescript
import { serve } from 'routup';
import { app } from './app.ts';

serve(app);
```

```bash
node server.ts
```

- The Node.js versions that run `.ts` files without a build are on the [Quickstart](/guide/quickstart#run-it).
- `toNodeHandler(app)` turns the app into a `(req, res)` listener for an existing Node.js server; see [Serving](/guide/dispatchers#tonodehandler).

## Bun

```typescript
import { serve } from 'routup/bun';
import { app } from './app.ts';

serve(app);
```

```bash
bun server.ts
```

## Deno

Add routup with Deno's command from [Installation](/guide/installation).

```typescript
import { serve } from 'routup/deno';
import { app } from './app.ts';

serve(app);
```

```bash
deno run --allow-net --allow-env server.ts
```

- `--allow-net` lets the server listen. `--allow-env` lets it read `PORT` and `HOST` (see [serve options](/guide/dispatchers#serve)).

## Cloudflare Workers

```bash
npx wrangler dev
```

- A Worker exports the server instead of starting it: `export default serve(app, { manual: true })` with `serve` from `routup/cloudflare`. The [Cloudflare Workers example](/examples/cloudflare-workers) has the worker file, the `wrangler.jsonc` and how a handler reaches bindings.

## Service Workers

```typescript
import { serve } from 'routup/service-worker';
import { app } from './app.ts';

serve(app);
```

- The worker script imports TypeScript and bare package specifiers, so bundle it first. Inside a service worker, `serve()` answers `fetch` events with the app. A request the app answers with 404 is passed on to the network.

## Other Runtimes

Hand the `fetch` method of the server that `serve()` from `routup/generic` returns to the runtime. [`app.fetch()`](/guide/dispatchers#app-fetch) does the same without a server object.
