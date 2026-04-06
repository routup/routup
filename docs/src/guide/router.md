# Router

The `Router` is the central building block. It manages a stack of handlers and dispatches requests through them.

```typescript
import { Router, coreHandler, serve } from 'routup';

const router = new Router();

router.get('/', coreHandler((event) => {
    return 'Hello, World!';
}));

serve(router, { port: 3000 });
```

## HTTP Methods

The router provides shorthand methods for all common HTTP verbs:

```typescript
router.get('/users', coreHandler((event) => { /* ... */ }));
router.post('/users', coreHandler((event) => { /* ... */ }));
router.put('/users/:id', coreHandler((event) => { /* ... */ }));
router.patch('/users/:id', coreHandler((event) => { /* ... */ }));
router.delete('/users/:id', coreHandler((event) => { /* ... */ }));
```

## Mounting

### Global

Mount a handler or router without a path prefix:

```typescript
router.use(coreHandler((event) => {
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
users.get('/', coreHandler((event) => {
    return [{ id: 1, name: 'Alice' }];
}));
users.get('/:id', coreHandler((event) => {
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

## router.fetch()

You can call `router.fetch()` directly with a `Request` object to get a `Response`. This is the Web Fetch API compatible entry point that srvx calls internally:

```typescript
const router = new Router();
router.get('/', coreHandler(() => 'Hello'));

const response = await router.fetch(
    new Request('http://localhost/')
);
console.log(await response.text()); // "Hello"
```

This is useful for testing, serverless environments, and any runtime that supports the Fetch API.
