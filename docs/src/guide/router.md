# Router

The `Router` is the central building block. It manages a stack of handlers and dispatches requests through them.

```typescript
import { Router, defineCoreHandler, serve } from 'routup';

const router = new Router();

router.get('/', defineCoreHandler((event) => {
    return 'Hello, World!';
}));

serve(router, { port: 3000 });
```

## HTTP Methods

The router provides shorthand methods for all common HTTP verbs:

```typescript
router.get('/users', defineCoreHandler((event) => { /* ... */ }));
router.post('/users', defineCoreHandler((event) => { /* ... */ }));
router.put('/users/:id', defineCoreHandler((event) => { /* ... */ }));
router.patch('/users/:id', defineCoreHandler((event) => { /* ... */ }));
router.delete('/users/:id', defineCoreHandler((event) => { /* ... */ }));
```

## Mounting

### Global

Mount a handler or router without a path prefix:

```typescript
router.use(defineCoreHandler((event) => {
    // runs for all requests
    return event.next();
}));
```

### Path

Mount on a specific path prefix:

```typescript
router.use('/api', apiRouter);
```

Or set the path in the router options:

```typescript
const apiRouter = new Router({ path: '/api' });
router.use(apiRouter);
```

## Nesting

Routers can be nested for modular route organization:

```typescript
const users = new Router();
users.get('/', defineCoreHandler((event) => {
    return [{ id: 1, name: 'Alice' }];
}));
users.get('/:id', defineCoreHandler((event) => {
    return { id: event.params.id };
}));

const api = new Router();
api.use('/users', users);

const app = new Router();
app.use('/api', api);
// GET /api/users, GET /api/users/:id
```

## router.mount() <Badge type="warning" text="experimental" />

Mount an external fetch handler at a given path. The handler receives requests with the mount prefix stripped from the URL.

```typescript
// Mount an object with a fetch method
router.mount('/api', externalApp);

// Mount a plain fetch function
router.mount('/proxy', (request) => {
    return fetch(request);
});
```

This is useful for integrating other frameworks or services that expose a Fetch-compatible interface.

## Timeout

### Global Timeout

Set a global request timeout that applies to the entire dispatch pipeline. When exceeded, a `408 Request Timeout` response is returned and `event.signal` is aborted:

```typescript
const router = new Router({ timeout: 5000 }); // 5 seconds
```

### Per-Handler Timeout

Set a default timeout for individual handler execution. Each handler's `fn()` is independently timed. When the timeout fires, `event.signal` inside the handler is aborted for cooperative cancellation:

```typescript
const router = new Router({
    handlerTimeout: 2000,              // 2s default per handler
    handlerTimeoutOverridable: false,  // handlers can only narrow, not extend (default)
});
```

Handlers can override the default via the verbose syntax:

```typescript
router.get('/slow', defineCoreHandler({
    timeout: 10000, // 10s for this handler only
    fn: async (event) => fetchSlowData(),
}));
```

When `handlerTimeoutOverridable` is `false`, the effective timeout is `Math.min(handlerTimeout, handler.timeout)`. Set it to `true` to let handlers extend beyond the default.

### Cooperative Cancellation

Both timeout levels abort `event.signal` when the deadline fires. Handlers can pass it to signal-aware APIs:

```typescript
defineCoreHandler(async (event) => {
    const res = await fetch('https://api.example.com', { signal: event.signal });
    return res.json();
});
```

## router.fetch()

You can call `router.fetch()` directly with a `Request` object to get a `Response`. This is the Web Fetch API compatible entry point that srvx calls internally:

```typescript
const router = new Router();
router.get('/', defineCoreHandler(() => 'Hello'));

const response = await router.fetch(
    new Request('http://localhost/')
);
console.log(await response.text()); // "Hello"
```

This is useful for testing, serverless environments, and any runtime that supports the Fetch API.
