# Installation

Routup is one npm package. Its server adapters come from its `srvx` dependency, so there is nothing else to install to serve an app.

::: code-group

```bash [npm]
npm install routup
```

```bash [pnpm]
pnpm add routup
```

```bash [yarn]
yarn add routup
```

```bash [bun]
bun add routup
```

```bash [deno]
deno add npm:routup
```

:::

## Requirements

- Node.js 22 or later (`engines.node` is `>=22.0.0`).
- ESM only: the package ships `.mjs` files and has no `require` export condition. Load it with `import`.

## Entry points

Every entry exports the full core API (`App`, `defineCoreHandler`, `defineErrorHandler`, the routers, the request and response helpers) and adds a `serve(app, options?)` built on the matching srvx adapter.

| Import | `serve()` uses | Also exports |
|--------|----------------|--------------|
| `routup/node` | `node:http` | `toNodeHandler(app)` |
| `routup/bun` | `Bun.serve()` | |
| `routup/deno` | `Deno.serve()` | |
| `routup/cloudflare` | a Workers `fetch` handler | |
| `routup/service-worker` | a Service Worker `fetch` listener | |
| `routup/generic` | no listener; the returned server has a `fetch()` method | |

The bare `routup` import picks one of these through export conditions. Which one each runtime gets is on [Runtime environments](/guide/runtime-environments#the-bare-routup-import).

## TypeScript

- Type declarations ship with the package, one `.d.mts` file per entry.
- TypeScript reads the `exports` map only with `moduleResolution` set to `node16`, `nodenext` or `bundler`.
- `node16` and `nodenext` match the `node` condition and type the bare import from the Node entry. `bundler` does not match `node` and types it from the generic entry, which has no `toNodeHandler`; import that from `routup/node`.
