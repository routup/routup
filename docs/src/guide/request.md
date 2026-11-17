# Request

The incoming request is accessed through the event object (`IAppEvent`) passed to every handler.

## Event Properties

The event provides direct access to common request data:

```typescript
defineCoreHandler((event) => {
    event.request;      // ServerRequest
    event.method;       // "GET", "POST", etc.
    event.path;         // URL path (e.g. "/users/123")
    event.params;       // Route parameters (e.g. { id: "123" })
    event.headers;      // Request headers (Headers object)
    event.searchParams; // URL search parameters (URLSearchParams)
    event.mountPath;    // Path prefix the running handler's route consumed
    event.route;        // Last method-bound route that ran: { path, pathPrefix, method }, or undefined
    event.nextCalled;   // Whether event.next() has been called
    event.store;        // Per-request state store
});
```

## Dispatched Route

`event.route` names the last method-bound route (registered with `get()`, `post()`, ...) dispatched in the request:

- `path`: the route's full pattern over every mount (`/api/users/:id`)
- `pathPrefix`: the pattern prefix the route was mounted under (the App's `path` option and every mount path above it, `'/'` without any)
- `method`: the method the route is bound to (`GET` also for a `HEAD` request it serves)

It is request-wide, so a middleware reads the endpoint's route after `await event.next()`. A route counts once its handler ran, also when that handler passed on with `event.next()`: after a method-bound guard such as `app.get('/admin/*rest', guard)`, a request that ends in a 404 still reads the guard's route. It is `undefined` until a method-bound route ran: before `event.next()`, for a request only middleware or method-less mounts handled, and for an `OPTIONS` request answered without a route. When a route throws and an error handler answers, it is the route that threw.

```typescript
const users = new App();
users.get('/:id', defineCoreHandler((event) => ({ id: event.params.id })));

const app = new App();

app.use(defineCoreHandler(async (event) => {
    const response = await event.next();

    // GET /api/users/42 -> { path: '/api/users/:id', pathPrefix: '/api/users', method: 'GET' }
    console.log(event.route?.path ?? 'unmatched');

    return response;
}));

app.use('/api/users', users);
```

Unlike `event.mountPath`, the concrete prefix of the request path the running handler's route consumed (per handler), `event.route.pathPrefix` is a pattern and belongs to the endpoint's route (per request).

## Reading the Body

For body parsing (JSON, form-urlencoded), use the `@routup/body` plugin.

For binary or streaming access, use the underlying request methods directly:

```typescript
defineCoreHandler(async (event) => {
    const buffer = await event.request.arrayBuffer();
    const blob = await event.request.blob();
    const stream = event.request.body; // ReadableStream
});
```

The [REST API example](/examples/rest-api) reads JSON bodies with `@routup/body`.

## Request Helpers

Helpers are standalone functions that take the event as their first argument:

```typescript
import {
    getRequestHostName,
    getRequestIP,
    getRequestProtocol
} from 'routup';

defineCoreHandler((event) => {
    const hostname = getRequestHostName(event);
    const ip = getRequestIP(event);
    const protocol = getRequestProtocol(event);
    return { hostname, ip, protocol };
});
```

## Data Sharing

To share data between handlers, use `event.store`:

```typescript
import { defineCoreHandler, App } from 'routup';

const app = new App();

app.use(defineCoreHandler((event) => {
    event.store.userId = '42';
    return event.next();
}));

app.get('/', defineCoreHandler((event) => {
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
defineCoreHandler((event) => {
    const page = event.searchParams.get('page');
    const tags = event.searchParams.getAll('tag');
    return { page, tags };
});
```

For advanced query parsing (nested objects, arrays), use the `@routup/query` plugin.
