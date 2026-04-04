# Handlers

Handlers are functions that process requests. They receive a `DispatchEvent` and return a value that becomes the response.

## Core Handlers

A core handler processes a request and returns a response value:

```typescript
import { coreHandler } from 'routup';

const handler = coreHandler((event) => {
    return { message: 'Hello, World!' };
});
```

## Error Handlers

An error handler is called when an error occurs in a previous handler:

```typescript
import { errorHandler } from 'routup';

const handler = errorHandler((error, event) => {
    event.response.status = 500;
    return { error: error.message };
});
```

## Return Values

Handlers return values that are automatically converted to `Response` objects:

```typescript
// String — sent as text/plain
coreHandler(() => 'Hello, World!');

// Object/Array — sent as application/json
coreHandler(() => ({ name: 'Alice' }));

// Response — sent as-is
coreHandler(() => new Response('Custom', { status: 201 }));

// ReadableStream, Blob, ArrayBuffer — sent as binary
coreHandler(() => new Blob(['data']));

// null — empty 204 response
coreHandler(() => null);
```

## Middleware

A handler that calls `event.next()` acts as middleware. It can inspect or modify the request, then pass control to the next handler:

```typescript
coreHandler(async (event) => {
    console.log(`${event.method} ${event.path}`);
    return event.next();
});
```

You can also modify the downstream response:

```typescript
coreHandler(async (event) => {
    const response = await event.next();
    // inspect or modify the response
    return response;
});
```

## Declaration Styles

### Shorthand

Pass a function directly:

```typescript
const handler = coreHandler((event) => {
    return 'Hello, World!';
});
```

### Verbose

Pass a configuration object with path, method, and handler function:

```typescript
const handler = coreHandler({
    method: 'GET',
    path: '/users/:id',
    fn: (event) => {
        return { id: event.params.id };
    }
});
```

## Mounting

### Global

```typescript
router.use(coreHandler((event) => {
    return event.next();
}));
```

### By Method

```typescript
router.get('/', coreHandler((event) => 'Hello'));
router.post('/users', coreHandler((event) => { /* ... */ }));
```

### By Path

```typescript
router.use('/api', coreHandler((event) => {
    return { api: true };
}));
```

### By Path and Method

```typescript
router.get('/users/:id', coreHandler((event) => {
    return { id: event.params.id };
}));
```
