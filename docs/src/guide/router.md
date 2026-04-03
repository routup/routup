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

## router.fetch()

You can call `router.fetch()` directly with a `Request` object to get a `Response`:

```typescript
const router = new Router();
router.get('/', coreHandler(() => 'Hello'));

const response = await router.fetch(
    new Request('http://localhost/')
);
console.log(await response.text()); // "Hello"
```

## router.mount() (experimental)

An experimental method to mount a router at a specific path:

```typescript
const child = new Router();
router.mount('/api', child);
```
