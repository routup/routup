# App

The `App` holds the routes of an application and answers requests with `app.fetch()`. The [App guide](/guide/app) explains mounting and nesting.

## `App`

```typescript
declare class App implements IApp {
    constructor(input?: AppContext);
}
```

Creates an application. Every argument is optional.

```typescript
import { App, TrieRouter, defineCoreHandler } from 'routup';

const app = new App({
    router: new TrieRouter(),
    options: { timeout: 10_000 },
});

app.get('/', defineCoreHandler(() => 'Hello'));
```

### Methods

| Method | Returns | Meaning |
|---|---|---|
| `fetch(request: AppRequest)` | `Promise<Response>` | Answer a request |
| `use(...)` | `this` | Register a handler, mount an App or install a plugin, optionally under a path |
| `get(path?, ...handlers)` | `this` | Register handlers for `GET`; they also answer `HEAD` |
| `post(path?, ...handlers)` | `this` | Register handlers for `POST` |
| `put(path?, ...handlers)` | `this` | Register handlers for `PUT` |
| `patch(path?, ...handlers)` | `this` | Register handlers for `PATCH` |
| `delete(path?, ...handlers)` | `this` | Register handlers for `DELETE` |
| `head(path?, ...handlers)` | `this` | Register handlers for `HEAD` |
| `options(path?, ...handlers)` | `this` | Register handlers for `OPTIONS` |
| `setRouter(router: IRouter<Handler>)` | `void` | Replace the route table |
| `hasPlugin(name: string)` | `boolean` | Whether a plugin of that name is installed at any path |
| `hasPluginAt(name: string, path?: Path)` | `boolean` | Whether it is installed at `path` (the root when omitted) |
| `getPluginVersion(name: string)` | `string \| undefined` | Version of an installed plugin, from any of its paths |
| `getPluginVersionAt(name: string, path?: Path)` | `string \| undefined` | Version of the install at `path` (the root when omitted) |
| `getPluginMountPaths(name: string)` | `readonly string[]` | Every path the plugin is installed at, `[]` when none |

| Property | Type | Meaning |
|---|---|---|
| `name` | `string \| undefined` | The `name` passed to the constructor |
| `routes` | `readonly Route<Handler>[]` | Registered routes in registration order |
| `plugins` | `ReadonlyMap<string, ReadonlyMap<string, string \| undefined>>` | Installed plugins: name, then mount path, then version |
| `pluginSingletons` | `ReadonlySet<string>` | Names of plugins installed with `singleton: true` |

### app.fetch()

```typescript
fetch(request: AppRequest): Promise<Response>;
```

Runs the request through the matching handlers. A plain `Request` is accepted.

- It does not reject when a handler throws. Without a handler that answers, it resolves with the [fallback response](/guide/error-handling#fallback-response): the pending error's status, or 404.
- An `OPTIONS` request that no handler answers gets an `Allow` header listing the methods of the matched routes.
- `serve()` and `toNodeHandler()` call it for you; see [Serving](/guide/dispatchers). Tests call it directly; see [Testing](/guide/testing).

### app.use()

```typescript
use(app: IApp): this;
use(handler: Handler | HandlerOptions): this;
use(plugin: Plugin): this;
use(path: Path, app: IApp): this;
use(path: Path, handler: Handler | HandlerOptions): this;
use(path: Path, plugin: Plugin): this;
```

- A handler without a `method` matches every request whose path starts with `path`. A handler defined with a `method` matches that method and the exact path.
- Mounting an App copies its routes and plugins into this App when `use()` is called. Routes added to the child later are not registered, and the child's `options` are discarded: its handlers run with the options of the App that answers the request.
- A plugin is installed into a fresh App that is then mounted at `path`. Installing the same plugin again adds its handlers again, unless the plugin sets `singleton` or `singletonByPath`. See [Plugins](/guide/plugins).

```typescript
const api = new App();
api.get('/users', defineCoreHandler(() => []));

app.use('/api', api); // GET /api/users
```

### Method Shortcuts

`get()`, `post()`, `put()`, `patch()`, `delete()`, `head()` and `options()` take an optional path and one or more handlers, which run in order.

- The shortcut's method replaces a `method` given in the handler's options.
- A `path` in the handler's options is appended to the shortcut's path: `app.get('/users', defineCoreHandler({ path: '/:id', fn }))` registers `/users/:id`.
- The `path` of the App's constructor is prepended to every route it registers.

### app.setRouter()

```typescript
setRouter(router: IRouter<Handler>): void;
```

Registers every existing route on `router` and makes it the active route table. The cache of the previous router is dropped with it. See [Custom Router](/guide/custom-router).

### Plugin Queries

`hasPluginAt()` and `getPluginVersionAt()` read `path` relative to this App, the way `app.use(path, plugin)` takes it. `getPluginMountPaths()` returns full paths, which start with the App's own `path`. Plugins of a mounted App count as installed on the App it was mounted into, under the mount path.

```typescript
const app = new App({ path: '/api' });

app.use('/admin', authPlugin);

app.hasPlugin('auth');               // true
app.hasPluginAt('auth', '/admin');   // true
app.hasPluginAt('auth');             // false
app.getPluginMountPaths('auth');     // ['/api/admin']
```

## `AppContext`

```typescript
type AppContext = {
    name?: string,
    path?: Path,
    options?: AppOptionsInput,
    router?: IRouter<Handler>,
};
```

The argument of `new App()`.

| Name | Type | Default | Meaning |
|---|---|---|---|
| `name` | `string` | none | A label for the App |
| `path` | `Path` | none | Prefix prepended to every route this App registers; not passed on to Apps mounted into it |
| `options` | `AppOptionsInput` | `{}` | Runtime options, see [`AppOptions`](#appoptions) |
| `router` | `IRouter<Handler>` | `new LinearRouter()` | The route table; see [Custom Router](/guide/custom-router) |

```typescript
const api = new App({ path: '/api' });

api.get('/users', defineCoreHandler(() => [])); // GET /api/users
```

## `AppOptions`

```typescript
type AppOptions = {
    timeout?: number,
    handlerTimeout?: number,
    handlerTimeoutOverridable?: boolean,
    subdomainOffset?: number,
    proxyIpMax?: number,
    etag?: EtagFn | null,
    trustProxy?: TrustProxyFn,
};
```

The runtime options of an App, read by handlers as `event.appOptions`. The constructor takes `AppOptionsInput`, which accepts looser `etag` and `trustProxy` values and converts them into the shapes above.

| Name | Input type | Default | Meaning |
|---|---|---|---|
| `timeout` | `number` | none | Milliseconds for the whole request; see [Timeouts](/guide/timeouts) |
| `handlerTimeout` | `number` | none | Milliseconds for each handler's `fn`; see [Timeouts](/guide/timeouts) |
| `handlerTimeoutOverridable` | `boolean` | `false` | Whether a handler's `timeout` may be longer than `handlerTimeout` |
| `etag` | `boolean \| null \| EtagOptions \| EtagFn` | weak ETags | ETag of string and JSON bodies; `false` or `null` turns it off |
| `trustProxy` | `boolean \| number \| string \| string[] \| TrustProxyFn` | no proxy is trusted | Which addresses may set `X-Forwarded-*` headers |
| `subdomainOffset` | `number` | none | Read by no routup helper; available to plugins in `event.appOptions` |
| `proxyIpMax` | `number` | none | Read by no routup helper; available to plugins in `event.appOptions` |

- A `timeout` or `handlerTimeout` that is not a positive finite number is ignored.
- With `etag`, a request whose `If-None-Match` matches the computed ETag gets `304 Not Modified`. `EtagOptions` is `{ weak?: boolean, threshold?: number }`: `weak` defaults to `true`, and bodies of `threshold` bytes or fewer get no ETag. An `EtagFn` is `(body: string, size?: number) => Promise<string | undefined>`.
- `trustProxy` is the default of `getRequestIP()`, `getRequestHostName()` and `getRequestProtocol()` when the call passes none. `true` trusts every address, a number trusts that many hops, a string (comma separated) or array lists addresses and CIDR ranges, and a `TrustProxyFn` is `(address: string, hop: number) => boolean`.
- The options are frozen when the App is created.

```typescript
const app = new App({
    options: {
        etag: false,
        trustProxy: ['127.0.0.1', '10.0.0.0/8'],
    },
});
```

## `IApp`

The interface `App` implements, with the methods and properties listed under [`App`](#app). `serve()`, `toNodeHandler()` and `app.use()` take an `IApp`, and a plugin's `install` receives one.

## `Plugin`

```typescript
type Plugin = {
    name: string,
    version?: string,
    singleton?: boolean,
    singletonByPath?: boolean,
    install: PluginInstallFn,
};

type PluginInstallFn = (router: IApp) => any;
```

The object [`app.use()`](#app-use) installs. [Plugin Authoring](/guide/plugin-authoring/#the-plugin-interface) explains the fields.

## Serving

`serve()` and `toNodeHandler()` connect an App to a server. [Serving](/guide/dispatchers) explains their options and use.

### `serve`

```typescript
declare function serve(app: IApp, options?: Omit<ServerOptions, 'fetch'>): Server;
```

Starts a server of the current runtime with srvx that answers every request with `app.fetch()`. Every entry point exports it, the bare `routup` import included. It returns the `Server` type of its entry: `Server<CloudflareFetchHandler>` on `routup/cloudflare`, `Server<ServiceWorkerHandler>` on `routup/service-worker`.

### `toNodeHandler`

```typescript
declare function toNodeHandler(app: IApp): NodeHttp1Handler & NodeHttp2Handler & AdapterMeta;
```

Converts an App into a Node.js `(req, res)` handler for `node:http` and `node:http2` servers. Only the Node.js entry exports it; import it from `routup/node`.
