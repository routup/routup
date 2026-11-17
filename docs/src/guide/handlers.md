# Handlers

Handlers are functions that process requests. They receive an `IAppEvent` and return a value that becomes the response.

## Core Handlers

A core handler processes a request and returns a response value:

```typescript
import { defineCoreHandler } from 'routup';

const handler = defineCoreHandler((event) => {
    return { message: 'Hello, World!' };
});
```

## Error Handlers

An error handler receives the pending error as the first argument and the event as the second:

```typescript
import { defineErrorHandler } from 'routup';

const handler = defineErrorHandler((error, event) => {
    event.response.status = error.status;
    return { error: error.message };
});
```

When it runs and where to register it is described in [Error Handling](/guide/error-handling).

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

A handler that returns `undefined` must call `event.next()`, now or from a later callback; otherwise the request waits. See [Returning `undefined`](/guide/timeouts#returning-undefined).

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

The verbose form also takes a per-handler `timeout` (see [Timeouts and Cancellation](/guide/timeouts)) and the callbacks below.

### Instrumentation callbacks

`onBefore`, `onAfter` and `onError` in the verbose form run around the handler's `fn`. See [Lifecycle Callbacks](/guide/lifecycle-callbacks).

## Mounting

### Global

```typescript
app.use(defineCoreHandler((event) => {
    return event.next();
}));
```

### By Method

```typescript
app.get('/', defineCoreHandler((event) => 'Hello'));
app.post('/users', defineCoreHandler((event) => { /* ... */ }));
```

### By Path

```typescript
app.use('/api', defineCoreHandler((event) => {
    return { api: true };
}));
```

### By Path and Method

```typescript
app.get('/users/:id', defineCoreHandler((event) => {
    return { id: event.params.id };
}));
```
