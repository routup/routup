# Cloudflare Workers

An app deployed as a Cloudflare module worker: `app.ts` holds the routes, `worker.ts` is the module the Workers runtime calls, and `wrangler.jsonc` configures the deployment.

<<< @/../examples/cloudflare-workers/app.ts

`worker.ts`:

<<< @/../examples/cloudflare-workers/worker.ts

`wrangler.jsonc`:

<<< @/../examples/cloudflare-workers/wrangler.jsonc

## Try It

Install `routup` and `wrangler`, put the three files in one folder and start the local Workers runtime:

```bash
npx wrangler dev
```

```bash
curl http://localhost:8787/
# Hello from Workers
```

## How It Works

- A module worker's default export is an object with a `fetch(request, env, ctx)` method. `serve(app, { manual: true })` from `routup/cloudflare` returns a server whose `fetch` has that signature and passes the request to `app.fetch()`. See [Runtime Environments](/guide/runtime-environments) for the entry each runtime loads.
- `manual: true` keeps `serve()` from registering a `fetch` event listener with `addEventListener()`, the Service Worker format.
- A handler reaches the bindings (KV, D1, secrets) as `event.request.runtime?.cloudflare?.env` and the execution context as `event.request.runtime?.cloudflare?.context`. With the default `trustProxy`, [`getRequestIP(event)`](/api/request-helpers#getrequestip) returns the `cf-connecting-ip` header.
