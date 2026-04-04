# Request

The incoming request is accessed through the `DispatchEvent` object passed to every handler.

## Event Properties

The event provides direct access to common request data:

```typescript
coreHandler((event) => {
    event.request;      // ServerRequest (srvx)
    event.method;       // "GET", "POST", etc.
    event.path;         // URL path (e.g. "/users/123")
    event.params;       // Route parameters (e.g. { id: "123" })
    event.headers;      // Request headers
    event.searchParams; // URL search parameters
    event.mountPath;    // Path prefix where this router is mounted
});
```

## Reading the Body

Use `readBody()` to parse the request body. It automatically handles JSON, form data, and text. Results are cached for repeated access.

```typescript
import { coreHandler, readBody } from 'routup';

router.post('/users', coreHandler(async (event) => {
    const body = await readBody(event);
    return { created: body.name };
}));
```

## Request Helpers

Helpers are standalone functions that take the event as their first argument:

```typescript
import {
    getRequestHostName,
    getRequestIP
} from 'routup';

coreHandler((event) => {
    const hostname = getRequestHostName(event);
    const ip = getRequestIP(event);
    return { hostname, ip };
});
```

## Data Sharing

To share data between handlers, use `setRequestEnv` and `useRequestEnv`:

```typescript
import {
    coreHandler,
    Router,
    setRequestEnv,
    useRequestEnv
} from 'routup';

const router = new Router();

router.use(coreHandler((event) => {
    setRequestEnv(event, 'userId', '42');
    return event.next();
}));

router.get('/', coreHandler((event) => {
    const userId = useRequestEnv(event, 'userId');
    return { userId };
}));
```
