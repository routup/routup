# Cloudflare Workers

An app deployed as a Cloudflare module worker: `app.ts` holds the routes, `worker.ts` is the module the Workers runtime calls, and `wrangler.jsonc` configures the deployment.

<<< @/../examples/cloudflare-workers/app.ts

`worker.ts`:

<<< @/../examples/cloudflare-workers/worker.ts

`wrangler.jsonc`:

<<< @/../examples/cloudflare-workers/wrangler.jsonc

## Try it

Install `routup` and `wrangler`, put the three files in one folder and start the local Workers runtime:

```bash
npx wrangler dev
```

```bash
curl http://localhost:8787/
# Hello from Workers
```

## How it works

- A module worker's default export is an object with a `fetch(request, env, ctx)` method. `app.fetch()` takes the Web `Request` and returns the `Response`. See [app.fetch()](/guide/app#app-fetch).
- `serve()` from `routup/cloudflare` registers a `fetch` event listener with `addEventListener()`, the Service Worker format. A module worker uses the default export instead.
- `env` and `ctx` are not passed on, and `event.request.ip` is not set, so `getRequestIP()` returns `undefined`.
