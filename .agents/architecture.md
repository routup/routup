# Architecture

## Core Concepts

Routup's architecture centers on a **dispatch pipeline** that processes HTTP requests through a stack of handlers, with runtime adapters abstracting away platform differences.

### Request Flow

```
HTTP Request → Adapter → DispatchEvent → Router Pipeline → Response
```

1. An **Adapter** (Node or Web) receives the raw request and creates a `DispatchEvent`
2. The **Router** iterates its handler stack, matching path and method
3. Matched **Handlers** execute in order, calling `next()` to continue
4. **Hooks** fire at each pipeline step for cross-cutting concerns
5. The response is sent back through the adapter

### Pipeline Steps

The router dispatches through these ordered steps:

```
START → LOOKUP → CHILD_BEFORE → CHILD_DISPATCH → CHILD_AFTER → FINISH
```

Each step corresponds to hook events that plugins and middleware can tap into.

## Adapter Pattern

Adapters bridge the Router to specific JavaScript runtimes:

```typescript
// Node.js — use with http.createServer()
import { Router, createNodeDispatcher } from 'routup';
const router = new Router();
const dispatch = createNodeDispatcher(router);
http.createServer(dispatch);

// Web API — use with Bun, Deno, Cloudflare Workers
import { Router, createWebDispatcher } from 'routup';
const router = new Router();
const dispatch = createWebDispatcher(router);
// Bun.serve({ fetch: dispatch })
```

Both adapters:
- Create internal request/response objects from the native types
- Build a `DispatchEvent` with path, method, and references
- Call `router.dispatch(event)` to run the pipeline
- Convert the result back to the runtime's response format

## Handler System

Two handler types, both supporting shorthand and verbose syntax:

```typescript
// Core handler — shorthand
coreHandler((req, res, next) => {
    send(res, 'Hello');
});

// Core handler — verbose (with path and method)
coreHandler({
    path: '/users/:id',
    method: 'GET',
    fn: (req, res, next) => {
        const id = useRequestParam(req, 'id');
        send(res, { id });
    }
});

// Error handler
errorHandler((err, req, res, next) => {
    send(res, { error: err.message });
});
```

Handlers are distinguished by arity: error handlers have 4 parameters, core handlers have 3.

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
| `dispatchStart` | Router begins processing a request |
| `dispatchEnd` | Router finishes processing |
| `childMatch` | A handler matches the current path/method |
| `childDispatchBefore` | Before executing a matched handler |
| `childDispatchAfter` | After a matched handler completes |
| `error` | An error occurs during dispatch |

```typescript
router.on('dispatchStart', (event) => { /* ... */ });
router.off('dispatchStart', listener);
```

## Plugin System

Plugins encapsulate reusable functionality:

```typescript
const myPlugin = {
    name: 'my-plugin',
    install(router: Router) {
        router.use(coreHandler((req, res, next) => {
            // plugin logic
            next();
        }));
    }
};

router.use(myPlugin);
```

## Request/Response Helpers

Helpers are standalone, tree-shakeable functions — not methods on the request/response objects:

```typescript
// Request helpers
useRequestPath(req)          // parsed URL path
useRequestParams(req)        // route parameters
useRequestHeader(req, name)  // single header
useRequestHostName(req)      // hostname
useRequestIP(req)            // client IP (proxy-aware)

// Response helpers
send(res, data)              // send any data (auto content-type)
sendFile(res, filePath)      // stream a file
setResponseHeader(res, k, v) // set header
setResponseStatus(res, code) // set status code
```

This design keeps the core lightweight — unused helpers are tree-shaken from the final bundle.

## Error Handling

Errors thrown in handlers are caught by the pipeline and routed to error handlers:

```typescript
// RoutupError with HTTP semantics
throw new RoutupError({ statusCode: 404, statusMessage: 'Not Found' });
```

`RoutupError` extends `@ebec/http`'s `HTTPError`, providing `statusCode` and `statusMessage` properties. Unhandled errors bubble up to the adapter, which sends an appropriate error response.
