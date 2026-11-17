# App

The `App` is the central building block. It manages a stack of handlers and dispatches requests through them.

```typescript
import { App, defineCoreHandler, serve } from 'routup';

const app = new App();

app.get('/', defineCoreHandler((event) => {
    return 'Hello, World!';
}));

serve(app, { port: 3000 });
```

## HTTP Methods

The app provides shorthand methods for all common HTTP verbs:

```typescript
app.get('/users', defineCoreHandler((event) => { /* ... */ }));
app.post('/users', defineCoreHandler((event) => { /* ... */ }));
app.put('/users/:id', defineCoreHandler((event) => { /* ... */ }));
app.patch('/users/:id', defineCoreHandler((event) => { /* ... */ }));
app.delete('/users/:id', defineCoreHandler((event) => { /* ... */ }));
```

## Mounting

### Global

Mount a handler or app without a path prefix:

```typescript
app.use(defineCoreHandler((event) => {
    // runs for all requests
    return event.next();
}));
```

### Path

Mount on a specific path prefix:

```typescript
app.use('/api', apiApp);
```

Or set the path in the app options:

```typescript
const apiApp = new App({ path: '/api' });
app.use(apiApp);
```

A handler of another framework that answers a Fetch API `Request` is mounted the same way after wrapping it with [`fromWebHandler()`](/api/handlers#fromwebhandler).

## Nesting

Apps can be nested for modular route organization:

```typescript
const users = new App();
users.get('/', defineCoreHandler((event) => {
    return [{ id: 1, name: 'Alice' }];
}));
users.get('/:id', defineCoreHandler((event) => {
    return { id: event.params.id };
}));

const api = new App();
api.use('/users', users);

const app = new App();
app.use('/api', api);
// GET /api/users, GET /api/users/:id
```

`use()` copies the child's routes and plugins into the parent when it runs. Routes added to the child afterwards do not reach the parent, so register them before mounting.

## Timeout

The `timeout`, `handlerTimeout` and `handlerTimeoutOverridable` options bound how long a request and each handler may take. See [Timeouts and Cancellation](/guide/timeouts).

## app.fetch()

You can call `app.fetch()` directly with a `Request` object to get a `Response`. This is the Web Fetch API compatible entry point that runtime adapters call internally:

```typescript
const app = new App();
app.get('/', defineCoreHandler(() => 'Hello'));

const response = await app.fetch(
    new Request('http://localhost/')
);
console.log(await response.text()); // "Hello"
```

This is useful for testing, serverless environments, and any runtime that supports the Fetch API. See [Testing](/guide/testing).
