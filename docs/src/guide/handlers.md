# Handlers

Handlers are functions that process requests. They receive an `IRoutupEvent` and return a value that becomes the response.

## Core Handlers

A core handler processes a request and returns a response value:

```typescript
import { defineCoreHandler } from 'routup';

const handler = defineCoreHandler((event) => {
    return { message: 'Hello, World!' };
});
```

## Error Handlers

An error handler is called when an error occurs in a previous handler. It receives the error as the first argument and the event as the second:

```typescript
import { defineErrorHandler } from 'routup';

const handler = defineErrorHandler((error, event) => {
    event.response.status = 500;
    return { error: error.message };
});
```

## Return Values

Handlers return values that are automatically converted to `Response` objects:

```typescript
// String — sent as text/plain
defineCoreHandler(() => 'Hello, World!');

// Object/Array — sent as application/json
defineCoreHandler(() => ({ name: 'Alice' }));

// Response — sent as-is
defineCoreHandler(() => new Response('Custom', { status: 201 }));

// ReadableStream, Blob, ArrayBuffer — sent as binary
defineCoreHandler(() => new Blob(['data']));

// null — empty response
defineCoreHandler(() => null);
```

### Returning `undefined`

`undefined` is **not** an implicit pass-through. A handler that returns `undefined` is making a contract: it must have either called `event.next()` (forwarding the downstream result) or it must intend `event.next()` to be invoked later from an async callback.

- Returning `undefined` after calling `event.next()` forwards the downstream result — `event.next()` and `return event.next()` are equivalent in outcome.
- Returning `undefined` without ever calling `event.next()` leaves the handler unresolved. The pipeline waits until either `event.next()` is invoked or `event.signal` aborts. With a global or per-handler `timeout`, this surfaces as `408 Request Timeout`. With no timeout configured, the request hangs by design — bugs become loud (deadlock) rather than silent (404 / wrong body).

## Middleware

A handler that calls `event.next()` acts as middleware. It can inspect or modify the request, then pass control to the next handler:

```typescript
defineCoreHandler(async (event) => {
    console.log(`${event.method} ${event.path}`);
    return event.next();
});
```

You can also modify the downstream response:

```typescript
defineCoreHandler(async (event) => {
    const response = await event.next();
    // inspect or modify the response
    return response;
});
```

The result of `event.next()` is cached — calling it multiple times returns the same response.

## Declaration Styles

### Shorthand

Pass a function directly:

```typescript
const handler = defineCoreHandler((event) => {
    return 'Hello, World!';
});
```

### Verbose

Pass a configuration object with path, method, and handler function:

```typescript
const handler = defineCoreHandler({
    method: 'GET',
    path: '/users/:id',
    fn: (event) => {
        return { id: event.params.id };
    }
});
```

The verbose form supports a per-handler `timeout` (in milliseconds) that overrides the router's `handlerTimeout` default:

```typescript
const handler = defineCoreHandler({
    timeout: 5000, // 5 seconds for this handler
    fn: async (event) => {
        return fetchSlowData();
    }
});
```

It also supports handler-level hooks:

```typescript
const handler = defineCoreHandler({
    fn: (event) => 'Hello, World!',
    onBefore(event) {
        // runs before the handler
    },
    onAfter(event) {
        // runs after the handler
    },
    onError(event) {
        // handle handler-specific errors
    }
});
```

## Mounting

### Global

```typescript
router.use(defineCoreHandler((event) => {
    return event.next();
}));
```

### By Method

```typescript
router.get('/', defineCoreHandler((event) => 'Hello'));
router.post('/users', defineCoreHandler((event) => { /* ... */ }));
```

### By Path

```typescript
router.use('/api', defineCoreHandler((event) => {
    return { api: true };
}));
```

### By Path and Method

```typescript
router.get('/users/:id', defineCoreHandler((event) => {
    return { id: event.params.id };
}));
```
