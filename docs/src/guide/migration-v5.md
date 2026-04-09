# Migrating to v5

Routup v5 is a major rewrite built on [srvx](https://srvx.unjs.io/) and Web Standard APIs. Handlers now receive a single `event` object and return responses instead of mutating `res`.

## Quick summary

| v4 | v5 |
|----|-----|
| `(req, res, next) => { send(res, data) }` | `(event) => data` |
| `createNodeDispatcher(router)` | `serve(router)` or `toNodeHandler(router)` |
| `createWebDispatcher(router)` | `router.fetch(request)` |
| `import { ... } from 'routup'` | `import { ... } from 'routup'` (runtime auto-detected via conditional exports) |

## Handler signatures

### Core handlers

```typescript
// v4
coreHandler((req, res, next) => {
    send(res, { hello: 'world' });
});

// v5 — return the value directly
defineCoreHandler((event) => {
    return { hello: 'world' };
});

// v5 — return a full Response for complete control
defineCoreHandler((event) => {
    return new Response(JSON.stringify({ hello: 'world' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
    });
});
```

### Error handlers

```typescript
// v4
errorHandler((err, req, res, next) => {
    send(res, { error: err.message });
});

// v5
defineErrorHandler((error, event) => {
    return { error: error.message };
});
```

### Middleware (calling next)

```typescript
// v4
coreHandler((req, res, next) => {
    console.log('before');
    next();
});

// v5 — event.next() returns the downstream Response
defineCoreHandler(async (event) => {
    console.log('before');
    const response = await event.next();
    console.log('after');
    return response;
});
```

## Response model

Handlers can return any of these values — `toResponse()` converts them automatically:

| Return value | Result |
|-------------|--------|
| `string` | `text/plain` response |
| `object` / `array` | JSON response |
| `Response` | Passed through as-is |
| `ReadableStream` | Streaming response |
| `ArrayBuffer` / `Uint8Array` | Binary response |
| `Blob` | Response with blob's content-type |
| `null` | Empty response |
| `undefined` | No response (middleware pass-through; pipeline continues) |

To set custom status or headers without constructing a full `Response`:

```typescript
defineCoreHandler((event) => {
    event.response.status = 201;
    event.response.headers.set('x-custom', 'value');
    return { created: true };
});
```

> **Note:** `event.response` is ignored when you return a `Response` object directly.

## Serving

```typescript
// v4
import { Router, createNodeDispatcher } from 'routup';
import http from 'node:http';

const router = new Router();
http.createServer(createNodeDispatcher(router));

// v5
import { Router, serve } from 'routup';

const router = new Router();
serve(router, { port: 3000 });

// v5 — Node.js http.createServer compatibility
import { Router, toNodeHandler } from 'routup';
const router = new Router();
http.createServer(toNodeHandler(router));

// v5 — direct fetch (for Bun, Deno, Cloudflare Workers, tests)
const response = await router.fetch(request);
```

## Request helpers

Many request helpers are replaced by event properties:

| v4 | v5 |
|----|-----|
| `useRequestPath(req)` | `event.path` |
| `useRequestParams(req)` | `event.params` |
| `useRequestParam(req, 'id')` | `event.params.id` |
| `useRequestMountPath(req)` | `event.mountPath` |
| `useRequestHeader(req, 'host')` | `event.headers.get('host')` |
| `getRequestHostName(req)` | `getRequestHostName(event)` |
| `getRequestIP(req)` | `getRequestIP(event)` |
| `getRequestProtocol(req)` | `getRequestProtocol(event)` |
| `getRequestAcceptableContentTypes(req)` | `getRequestAcceptableContentTypes(event)` |
| `matchRequestContentType(req, type)` | `matchRequestContentType(event, type)` |
| `setRequestEnv(req, key, value)` | `event.store[key] = value` |
| `useRequestEnv(req, key)` | `event.store[key]` |
| `unsetRequestEnv(req, key)` | `delete event.store[key]` |

### Body parsing

For body parsing, use the `@routup/body` plugin. For binary or streaming access, use the request directly:

```typescript
defineCoreHandler(async (event) => {
    const buffer = await event.request.arrayBuffer();
    const blob = await event.request.blob();
    const stream = event.request.body; // ReadableStream
});
```

### Query parameters

```typescript
// v5 — built-in (simple key-value)
event.searchParams.get('page');
event.searchParams.getAll('tag');

// For advanced parsing (nested objects, arrays), use @routup/query
```

## Response helpers

| v4 | v5 |
|----|-----|
| `send(res, data)` | Return the value from the handler |
| `sendCreated(res, data)` | `sendCreated(event, data)` |
| `sendAccepted(res)` | `sendAccepted(event)` |
| `sendRedirect(res, url)` | `sendRedirect(event, url)` |
| `sendFile(res, opts)` | `sendFile(event, opts)` |
| `sendStream(res, stream)` | `sendStream(event, stream)` |
| `setResponseHeader(res, k, v)` | `event.response.headers.set(k, v)` |
| `setResponseStatus(res, code)` | `event.response.status = code` |
| `setResponseHeaderAttachment(res)` | `setResponseHeaderAttachment(event)` |
| `setResponseCacheHeaders(res, opts)` | `setResponseCacheHeaders(event, opts)` |
| `sendWebResponse(res, webRes)` | Return the `Response` directly |
| `sendWebBlob(res, blob)` | Return the `Blob` directly |

## Hooks

| v4 | v5 |
|----|-----|
| `router.on('dispatchStart', fn)` | `router.on('request', fn)` |
| `router.on('dispatchEnd', fn)` | `router.on('response', fn)` |
| `router.on('error', fn)` | `router.on('error', fn)` |
| `router.on('childMatch', fn)` | `router.on('childMatch', fn)` |
| `router.on('childDispatchBefore', fn)` | `router.on('childDispatchBefore', fn)` |
| `router.on('childDispatchAfter', fn)` | `router.on('childDispatchAfter', fn)` |

## Express middleware

Use `fromNodeHandler()` or `fromNodeMiddleware()` to wrap existing Express/Connect middleware:

```typescript
import { Router, fromNodeMiddleware } from 'routup';
import cors from 'cors';

const router = new Router();
router.use(fromNodeMiddleware(cors()));
```

See [Express Compatibility](./express-compatibility.md) for details.

## Import paths

| Path | Resolves to |
|------|------------|
| `routup/node` | Node.js entry with `serve()` + `toNodeHandler()` |
| `routup/bun` | Bun entry with `serve()` |
| `routup/deno` | Deno entry with `serve()` |
| `routup/cloudflare` | Cloudflare Workers entry with `serve()` |
| `routup/service-worker` | Service Worker entry with `serve()` |
| `routup/generic` | Generic Web API entry with `serve()` |
