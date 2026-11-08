# Architecture

## Core Concepts

Routup's architecture centers on a **dispatch pipeline** that processes HTTP requests through the handlers matched by a pluggable router. It uses **srvx** as the universal HTTP server layer, providing a consistent `ServerRequest` interface across all runtimes.

### Request Flow

```text
HTTP Request → srvx → ServerRequest (AppRequest) → App.fetch() → DispatcherEvent → IRouter.lookup() → App.runMatches() → Handler.dispatch() → Response
```

1. **srvx** receives the raw HTTP request and normalizes it into a `ServerRequest`
2. **`App.fetch()`** creates a `DispatcherEvent` and applies the global timeout
3. **`App.dispatch()`** asks the active `IRouter` for the matches of the path and method
4. **`App.runMatches()`** walks the matches in order; matched **Handlers** run, returning response values or calling `event.next()`
5. Return values are converted to a Web `Response` via `toResponse()`
6. With no response, `App.fetch()` builds a fallback: the pending error's status (default 500), or 404. The body is JSON when the request accepts JSON, plain text otherwise

### Pipeline Rules

- CORE handlers run only while no error is pending; ERROR handlers run only while one is.
- The match list is captured once per dispatch. `IAppEvent.path` is a snapshot on the handler's event, so middleware cannot rewrite the path before `event.next()` (see #913).
- An `OPTIONS` request that no handler answers gets a synthesized `Allow` response on the root App, built from the methods of the matched routes.

## Entry Files Pattern

Routup uses conditional exports in `package.json` to auto-select the correct runtime adapter. Always import from `routup`:

```typescript
import { App, defineCoreHandler, serve } from 'routup';

const app = new App();
app.get('/', defineCoreHandler((event) => 'Hello'));
serve(app);
```

This works on Node.js, Bun, Deno, and Cloudflare Workers. Under the hood, each runtime resolves to a dedicated entry file (`src/_entries/*.ts`) that bundles:
- All core exports (App, handlers, helpers, etc.)
- Runtime-specific `serve()` function from srvx
- `toNodeHandler()` where applicable (Node.js entry)

Runtime-specific imports (`routup/node`, `routup/bun`, etc.) are still available but rarely needed.

## Handler System

Two handler types, both supporting shorthand and verbose syntax:

```typescript
// Core handler — shorthand (return-based response)
defineCoreHandler((event) => {
    return 'Hello';
});

// Core handler — verbose (with path and method)
defineCoreHandler({
    path: '/users/:id',
    method: 'GET',
    fn: (event) => {
        return { id: event.params.id };
    }
});

// Error handler
defineErrorHandler((error, event) => {
    return { error: error.message };
});
```

Handlers are distinguished by their `type` property (`HandlerType.CORE` or `HandlerType.ERROR`), set by the `defineCoreHandler()` and `defineErrorHandler()` factories. `fromNodeHandler()`, `fromNodeMiddleware()` and `fromWebHandler()` adapt foreign handlers.

### Response Model

Handlers return values directly instead of calling `send()`. The `toResponse()` function converts return values to a Web `Response`:

- **string** → `Response` with `text/plain` content type
- **object/array/number/boolean** → JSON `Response`
- **ArrayBuffer/Uint8Array** → binary `Response` with `application/octet-stream`
- **ReadableStream** → streamed `Response`
- **Blob** → `Response` with blob's content type
- **Response** → passed through as-is
- **null** → empty `Response` (status from `event.response`)

### Returning `undefined`

`undefined` is **not** treated as an implicit pass-through. A handler that returns `undefined` is making a contract: it must have either called `event.next()` (forwarding the downstream result) or it must intend `event.next()` to be invoked later from an async callback.

- **`undefined` after `event.next()` was called** → the captured downstream result becomes the response (so `event.next()` and `return event.next()` are equivalent).
- **`undefined` before `event.next()` is called** → the handler is considered unresolved. The pipeline waits until either `event.next()` is invoked (e.g. from a `setTimeout` or other async callback) or `event.signal` aborts. A global or per-handler `timeout` surfaces as a `408 Request Timeout`. With no timeout configured and no eventual `event.next()` call, the request hangs by design — bugs become loud (deadlock) rather than silent (404 / wrong body).

### Middleware and `event.next()`

Middleware handlers call `event.next()` to continue the pipeline (onion model). Always `return` (or `await` and re-return) the result so the response propagates:

```typescript
defineCoreHandler(async (event) => {
    // Before
    const response = await event.next();
    // After
    return response;
});
```

A side-effect middleware that just forwards downstream:

```typescript
defineCoreHandler((event) => {
    event.response.headers.set('x-trace', '...');
    return event.next();
});
```

`event.next(error)` forwards an error instead. Calling `next()` more than once returns the same cached result.

## AppEvent

The `AppEvent` (implementing `IAppEvent`) is the central object passed to every handler:

| Property | Type | Description |
|----------|------|-------------|
| `request` | `AppRequest` | The srvx-normalized request object |
| `params` | `Record<string, string \| undefined>` | Route parameters extracted from path |
| `path` | `string` | Current request path (relative to mount point) |
| `method` | `MethodNameLike` | HTTP method |
| `mountPath` | `string` | Path prefix where the handler is mounted |
| `headers` | `Headers` | Request headers |
| `searchParams` | `URLSearchParams` | Query string parameters |
| `response` | `AppResponse` | Response accumulator for status and headers |
| `store` | `Record<string \| symbol, unknown>` | Per-request state store for caching and plugin state |
| `appOptions` | `Readonly<AppOptions>` | Options of the App running the handler |
| `signal` | `AbortSignal` | Abort signal for cooperative cancellation (aborted on timeout) |
| `next(error?)` | `Promise<Response \| undefined>` | Continue with the next handler |
| `nextCalled` | `boolean` | Whether `next()` has been invoked |
| `nextResult` | `Promise<Response \| undefined> \| undefined` | The captured downstream result |

## App.fetch()

The `App` exposes a `fetch()` method as its public entry point, compatible with the Web Fetch API signature:

```typescript
const app = new App();
const response: Response = await app.fetch(request);
```

This is what srvx calls internally when routing requests.

## Routers

`App` delegates route lookup to an `IRouter`: `LinearRouter` (default), `TrieRouter`, or `SmartRouter`. Pass one with `new App({ router })` or `app.setRouter(router)`. Each router owns its lookup cache: `new TrieRouter({ cache })`, default bounded LRU (`LruCache`), `null` to disable.

## App Nesting

Apps can be mounted for modular route organization:

```typescript
const api = new App();
api.get('/users', handler);

const app = new App();
app.use('/api', api);  // /api/users
```

Mounting **flattens**: `app.use()` copies the child's routes and plugin registry into the parent's router at call time and does not retain the child. Routes added to the child after mounting do not reach the parent.

## Handler Lifecycle Callbacks

Per-handler instrumentation lives on the handler options; there is no App-level hook surface.

```typescript
defineCoreHandler({
    onBefore: (event) => { /* before fn */ },
    onAfter: (event, response) => { /* after the response is built */ },
    onError: (error, event) => { /* fn failed */ },
    fn: () => 'ok',
});
```

## Plugin System

Plugins encapsulate reusable functionality. A plugin has a `name`, an `install(app)` function, and optionally a semver `version` and `singleton` opt-in. By default the same plugin may be installed repeatedly and each install stacks.

```typescript
const myPlugin = {
    name: 'my-plugin',
    install(app: IApp) {
        app.use(defineCoreHandler(async (event) => {
            // plugin logic
            return event.next();
        }));
    }
};

app.use(myPlugin);
```

## Request/Response Helpers

Helpers are standalone, tree-shakeable functions:

```typescript
// Request helpers
getRequestHeader(event, name)            // single header
getRequestHostName(event)                // hostname
getRequestIP(event)                      // client IP (proxy-aware)

// Response helpers
event.response.headers.set(k, v)         // set header on response accumulator
event.response.status = code             // set status code
appendResponseHeader(event, name, value) // append to existing header
setResponseCacheHeaders(event, options)  // set cache headers
```

This design keeps the core lightweight — unused helpers are tree-shaken from the final bundle.

## Timeout

Routup supports two levels of timeout, both returning `408 Request Timeout`:

### Global timeout (`timeout`)

Applied in `App.fetch()` around the entire dispatch pipeline. Uses `AbortController` internally — when the timeout fires, `event.signal` is aborted for cooperative cancellation.

```typescript
const app = new App({ options: { timeout: 5000 } }); // 5s for entire request
```

### Per-handler timeout (`handlerTimeout`)

Applied in `Handler.dispatch()` around each handler's `fn()` execution. Handlers can override this default via their own `timeout` option. When the per-handler timeout fires, a handler-scoped `AbortController` is aborted so that `event.signal` inside the handler reflects the timeout — enabling cooperative cancellation for signal-aware APIs.

```typescript
const app = new App({
    options: {
        handlerTimeout: 2000,              // default: 2s per handler
        handlerTimeoutOverridable: false,  // handlers can only narrow, not extend
    },
});

// This handler gets a shorter timeout (1s)
app.get('/fast', defineCoreHandler({
    timeout: 1000,
    fn: (event) => fetchFastData(),
}));

// With handlerTimeoutOverridable: true, handlers can extend beyond the default
```

The child signal is linked to the parent signal (from the global timeout or request lifecycle), so a parent abort propagates to the handler. After handler execution, the parent→child listener is cleaned up.

### Cooperative cancellation

Both timeout levels abort `event.signal` when the deadline fires. Handlers can use `event.signal` for cooperative cancellation with signal-aware APIs:

```typescript
defineCoreHandler(async (event) => {
    const data = await fetch('https://api.example.com', { signal: event.signal });
    return data.json();
});
```

## Error Handling

Errors thrown in handlers are caught by the pipeline and routed to error handlers:

```typescript
// AppError with HTTP semantics
throw new AppError({ status: 404, message: 'Not Found' });
```

`AppError` extends `@ebec/http`'s `HTTPError`; `createError()` normalizes any thrown value into one. Unhandled errors become the fallback response described under Request Flow.
