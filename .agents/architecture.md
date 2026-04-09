# Architecture

## Core Concepts

Routup's architecture centers on a **dispatch pipeline** that processes HTTP requests through a stack of handlers. It uses **srvx** as the universal HTTP server layer, providing a consistent `ServerRequest` interface across all runtimes.

### Request Flow

```text
HTTP Request → srvx → ServerRequest → RoutupEvent → Router Pipeline → Response
```

1. **srvx** receives the raw HTTP request and normalizes it into a `ServerRequest`
2. The **Router**'s `fetch()` method creates a `RoutupEvent` from the request
3. The **Router** iterates its handler stack, matching path and method
4. Matched **Handlers** execute, returning response values or calling `event.next()`
5. Return values are converted to a Web `Response` via `toResponse()`
6. **Hooks** fire at each pipeline step for cross-cutting concerns

### Pipeline Steps

The router dispatches through these ordered steps:

```
START → LOOKUP → CHILD_BEFORE → CHILD_DISPATCH → CHILD_AFTER → FINISH
```

Each step corresponds to hook events that plugins and middleware can tap into.

## Entry Files Pattern

Routup uses conditional exports in `package.json` to auto-select the correct runtime adapter. Always import from `routup`:

```typescript
import { Router, defineCoreHandler, serve } from 'routup';

const router = new Router();
router.get('/', defineCoreHandler((event) => 'Hello'));
serve(router);
```

This works on Node.js, Bun, Deno, and Cloudflare Workers. Under the hood, each runtime resolves to a dedicated entry file (`src/_entries/*.ts`) that bundles:
- All core exports (Router, handlers, helpers, etc.)
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

Handlers are distinguished by their `type` property (`HandlerType.CORE` or `HandlerType.ERROR`), set by the `defineCoreHandler()` and `defineErrorHandler()` factories.

### Response Model

Handlers return values directly instead of calling `send()`. The `toResponse()` function converts return values to a Web `Response`:

- **string** → `Response` with `text/plain` content type
- **object/array/number/boolean** → JSON `Response`
- **ArrayBuffer/Uint8Array** → binary `Response` with `application/octet-stream`
- **ReadableStream** → streamed `Response`
- **Blob** → `Response` with blob's content type
- **Response** → passed through as-is
- **null** → empty `Response` (status from `event.response`)
- **undefined** → no response (middleware pass-through; pipeline continues)

### Middleware and `event.next()`

Middleware handlers call `event.next()` to continue the pipeline (onion model):

```typescript
defineCoreHandler(async (event) => {
    // Before
    const response = await event.next();
    // After
    return response;
});
```

## RoutupEvent

The `RoutupEvent` (implementing `IRoutupEvent`) is the central object passed to every handler:

| Property | Type | Description |
|----------|------|-------------|
| `request` | `RoutupRequest` | The srvx-normalized request object |
| `params` | `Record<string, any>` | Route parameters extracted from path |
| `path` | `string` | Current request path (relative to mount point) |
| `method` | `string` | HTTP method |
| `mountPath` | `string` | Path prefix where the router is mounted |
| `headers` | `Headers` | Request headers |
| `searchParams` | `URLSearchParams` | Query string parameters |
| `response` | `RoutupResponse` | Response accumulator for status, headers, statusText |
| `signal` | `AbortSignal` | Abort signal for cooperative cancellation (aborted on timeout) |
| `dispatched` | `boolean` | Whether a response has been produced |
| `store` | `Record<string \| symbol, unknown>` | Per-request state store for caching and plugin state |

## Router.fetch()

The `Router` exposes a `fetch()` method as its public entry point, compatible with the Web Fetch API signature:

```typescript
const router = new Router();
const response: Response = await router.fetch(request);
```

This is what srvx calls internally when routing requests.

## Router Nesting

Routers can be nested for modular route organization:

```typescript
const api = new Router();
api.get('/users', handler);

const app = new Router();
app.use('/api', api);  // /api/users
```

Child routers are dispatched as handlers in the parent's stack. The dispatch event's path is adjusted to strip the mount prefix.

## Hook System

Hooks provide lifecycle events on the Router:

| Hook | Fires when |
|------|-----------|
| `request` | Router begins processing a request |
| `response` | Router finishes processing and has a response |
| `error` | An error occurs during dispatch |

```typescript
router.on('request', (event) => { /* ... */ });
router.on('response', (event) => { /* ... */ });
router.on('error', (event) => { /* event.error contains the error */ });
```

## Plugin System

Plugins encapsulate reusable functionality:

```typescript
const myPlugin = {
    name: 'my-plugin',
    install(router: Router) {
        router.use(defineCoreHandler(async (event) => {
            // plugin logic
            return event.next();
        }));
    }
};

router.use(myPlugin);
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

Applied in `Router.fetch()` around the entire dispatch pipeline. Uses `AbortController` internally — when the timeout fires, `event.signal` is aborted for cooperative cancellation.

```typescript
const router = new Router({ timeout: 5000 }); // 5s for entire request
```

### Per-handler timeout (`handlerTimeout`)

Applied in `Handler.dispatch()` around each handler's `fn()` execution. Handlers can override this default via their own `timeout` option.

```typescript
const router = new Router({
    handlerTimeout: 2000,              // default: 2s per handler
    handlerTimeoutOverridable: false,  // handlers can only narrow, not extend
});

// This handler gets a shorter timeout (1s)
router.get('/fast', defineCoreHandler({
    timeout: 1000,
    fn: (event) => fetchFastData(),
}));

// With handlerTimeoutOverridable: true, handlers can extend beyond the default
```

### Cooperative cancellation

Handlers can use `event.signal` for cooperative cancellation with signal-aware APIs:

```typescript
defineCoreHandler(async (event) => {
    const data = await fetch('https://api.example.com', { signal: event.signal });
    return data.json();
});
```

## Error Handling

Errors thrown in handlers are caught by the pipeline and routed to error handlers:

```typescript
// RoutupError with HTTP semantics
throw new RoutupError({ statusCode: 404, statusMessage: 'Not Found' });
```

`RoutupError` extends `@ebec/http`'s `HTTPError`, providing `statusCode` and `statusMessage` properties. Unhandled errors are converted to an appropriate error response by the pipeline.
