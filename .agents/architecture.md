# Architecture

## Core Concepts

Routup's architecture centers on a **dispatch pipeline** that processes HTTP requests through a stack of handlers. It uses **srvx** as the universal HTTP server layer, providing a consistent `ServerRequest` interface across all runtimes.

### Request Flow

```
HTTP Request → srvx → ServerRequest → DispatchEvent → Router Pipeline → Response
```

1. **srvx** receives the raw HTTP request and normalizes it into a `ServerRequest`
2. The **Router**'s `fetch()` method creates a `DispatchEvent` from the request
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

Instead of adapters, Routup uses **entry files** that re-export the core API along with runtime-specific `serve()` and `toNodeHandler()` functions provided by srvx:

```typescript
// Node.js
import { Router, coreHandler, serve } from 'routup/node';
const router = new Router();
router.get('/', coreHandler((event) => 'Hello'));
serve(router);

// Bun
import { Router, coreHandler, serve } from 'routup/bun';
const router = new Router();
router.get('/', coreHandler((event) => 'Hello'));
serve(router);

// Deno
import { Router, coreHandler, serve } from 'routup/deno';

// Cloudflare Workers / generic Web API
import { Router, coreHandler } from 'routup/generic';
```

Each entry file (`src/_entries/*.ts`) bundles:
- All core exports (Router, handlers, helpers, etc.)
- Runtime-specific `serve()` function from srvx
- `toNodeHandler()` where applicable (Node.js entry)

## Handler System

Two handler types, both supporting shorthand and verbose syntax:

```typescript
// Core handler — shorthand (return-based response)
coreHandler((event) => {
    return 'Hello';
});

// Core handler — verbose (with path and method)
coreHandler({
    path: '/users/:id',
    method: 'GET',
    fn: (event) => {
        return { id: event.params.id };
    }
});

// Error handler
errorHandler((error, event) => {
    return { error: error.message };
});
```

Handlers are distinguished by arity: error handlers have 2 parameters `(error, event)`, core handlers have 1 parameter `(event)`.

### Response Model

Handlers return values directly instead of calling `send()`. The `toResponse()` function converts return values to a Web `Response`:

- **string** → `Response` with `text/html` content type
- **object/array** → JSON `Response`
- **Response** → passed through
- **null/undefined** → empty response (middleware that called `event.next()`)

### Middleware and `event.next()`

Middleware handlers call `event.next()` to continue the pipeline (onion model):

```typescript
coreHandler(async (event) => {
    // Before
    const response = await event.next();
    // After
    return response;
});
```

## DispatchEvent

The `DispatchEvent` is the central object passed to every handler:

| Property | Type | Description |
|----------|------|-------------|
| `request` | `ServerRequest` | The srvx-normalized request object |
| `params` | `Record<string, string>` | Route parameters extracted from path |
| `path` | `string` | Current request path (relative to mount point) |
| `method` | `string` | HTTP method |
| `mountPath` | `string` | Path prefix where the router is mounted |
| `headers` | `Headers` | Request headers |
| `searchParams` | `URLSearchParams` | Query string parameters |
| `response` | `object` | Response accumulator for headers, status, etc. |

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
router.on('response', (event, response) => { /* ... */ });
router.on('error', (error, event) => { /* ... */ });
```

## Plugin System

Plugins encapsulate reusable functionality:

```typescript
const myPlugin = {
    name: 'my-plugin',
    install(router: Router) {
        router.use(coreHandler(async (event) => {
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
readBody(event)                  // parse request body
useRequestHeader(event, name)    // single header
useRequestHostName(event)        // hostname
useRequestIP(event)              // client IP (proxy-aware)

// Response helpers
setResponseHeader(event, k, v)   // set header on response accumulator
setResponseStatus(event, code)   // set status code
```

This design keeps the core lightweight — unused helpers are tree-shaken from the final bundle.

## Error Handling

Errors thrown in handlers are caught by the pipeline and routed to error handlers:

```typescript
// RoutupError with HTTP semantics
throw new RoutupError({ statusCode: 404, statusMessage: 'Not Found' });
```

`RoutupError` extends `@ebec/http`'s `HTTPError`, providing `statusCode` and `statusMessage` properties. Unhandled errors are converted to an appropriate error response by the pipeline.
