# Quickstart

A first app with two routes, started on your runtime.

## Install

```bash
npm install routup
npm pkg set type=module
```

The second line marks the project as ESM, so Node.js loads `server.ts` without a module type warning. Other package managers and the requirements are on [Installation](/guide/installation).

## Write the App

`app.ts` defines the routes and starts nothing, so a test or another runtime can use the same file:

<<< @/../examples/quickstart/app.ts

`server.ts` starts it:

```typescript
import { serve } from 'routup';
import { app } from './app.ts';

serve(app);
```

## Run It

::: code-group

```bash [Node.js]
node server.ts
```

```bash [Bun]
bun server.ts
```

```bash [Deno]
deno run --allow-net --allow-env server.ts
```

```bash [Cloudflare Workers]
npx wrangler dev
```

:::

- **Node.js** runs `.ts` files directly from 22.18 (and 23.6 on the 23 line). On an older 22 release, run `npx tsx server.ts`. Node needs the `.ts` extension in relative imports.
- **Deno**: the permission flags are explained on [Runtime Environments](/guide/runtime-environments#deno).
- **Cloudflare Workers** use a different `server.ts`: a module worker exports the server instead of starting it. The [Cloudflare Workers example](/examples/cloudflare-workers) has the worker file and the `wrangler.jsonc`; `wrangler dev` listens on port 8787.

The server listens on port 3000 by default ([serve options](/guide/dispatchers#serve)).

```bash
curl http://localhost:3000/
# Hello, World!

curl http://localhost:3000/users/42
# {"id":"42"}
```

## What a Handler Returns

The string became a `text/plain` response and the object a JSON response. Every other value a handler can return (a `Response`, a stream, binary data, `null`) is listed on [Response](/guide/response#return-values).

## Next Steps

- [App](/guide/app): HTTP methods, mounting and nesting
- [Handlers](/guide/handlers): middleware with `event.next()` and error handlers
- [Paths](/guide/paths): parameters and wildcards
- [Error Handling](/guide/error-handling): `AppError`, error handlers and the fallback response
- [Lifecycle Callbacks](/guide/lifecycle-callbacks): `onBefore`, `onAfter` and `onError` around one handler
- [Timeouts and Cancellation](/guide/timeouts): request and handler timeouts, `event.signal`
- [Testing](/guide/testing): calling `app.fetch()` from a test
- [Runtime Environments](/guide/runtime-environments): the entry each runtime loads
- [Examples](/examples/): complete apps with tests
