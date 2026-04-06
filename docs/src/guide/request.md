# Request

The incoming request is accessed through the event object (`IRoutupEvent`) passed to every handler.

## Event Properties

The event provides direct access to common request data:

```typescript
coreHandler((event) => {
    event.request;      // ServerRequest (srvx)
    event.method;       // "GET", "POST", etc.
    event.path;         // URL path (e.g. "/users/123")
    event.params;       // Route parameters (e.g. { id: "123" })
    event.headers;      // Request headers (Headers object)
    event.searchParams; // URL search parameters (URLSearchParams)
    event.mountPath;    // Path prefix where this router is mounted
    event.dispatched;   // Whether a response has been produced
    event.store;        // Per-request state store
});
```

## Reading the Body <Badge type="warning" text="experimental" />

Use `readBody()` to parse the request body. It automatically handles JSON and form-urlencoded data. Results are cached for repeated access.

```typescript
import { coreHandler, readBody } from 'routup';

router.post('/users', coreHandler(async (event) => {
    const body = await readBody(event);
    return { created: body.name };
}));
```

For binary or streaming access, use the underlying request methods directly:

```typescript
coreHandler(async (event) => {
    const buffer = await event.request.arrayBuffer();
    const blob = await event.request.blob();
    const stream = event.request.body; // ReadableStream
});
```

## Request Helpers

Helpers are standalone functions that take the event as their first argument:

```typescript
import {
    getRequestHostName,
    getRequestIP,
    getRequestProtocol
} from 'routup';

coreHandler((event) => {
    const hostname = getRequestHostName(event);
    const ip = getRequestIP(event);
    const protocol = getRequestProtocol(event);
    return { hostname, ip, protocol };
});
```

## Data Sharing

To share data between handlers, use `event.store`:

```typescript
import { coreHandler, Router } from 'routup';

const router = new Router();

router.use(coreHandler((event) => {
    event.store.userId = '42';
    return event.next();
}));

router.get('/', coreHandler((event) => {
    const userId = event.store.userId;
    return { userId };
}));
```

Use symbol keys to avoid collisions between plugins:

```typescript
const USER_KEY = Symbol.for('myPlugin:user');

// In middleware
event.store[USER_KEY] = { id: 1, name: 'Alice' };

// In handler
const user = event.store[USER_KEY];
```

## Query Parameters

Query parameters are available via `event.searchParams` (a standard `URLSearchParams` object):

```typescript
coreHandler((event) => {
    const page = event.searchParams.get('page');
    const tags = event.searchParams.getAll('tag');
    return { page, tags };
});
```

For advanced query parsing (nested objects, arrays), use the `@routup/query` plugin.
