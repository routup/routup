# Migrating to v5

Routup v5 is a major rewrite built on [srvx](https://srvx.h3.dev) and Web Standard APIs. Handlers now receive a single `event` object and return responses instead of mutating `res`.

## Quick summary

| v4 | v5 |
|----|-----|
| `(req, res, next) => { send(res, data) }` | `(event) => data` |
| `createNodeDispatcher(router)` | `serve(router)` or `toNodeHandler(router)` |
| `createWebDispatcher(router)` | `router.fetch(request)` |
| `import { ... } from 'routup'` | `import { ... } from 'routup'` (auto-selects runtime) |
| `import { ... } from 'routup'` | `import { ... } from 'routup/node'` (explicit runtime) |

## Handler signatures

### Core handlers

```typescript
// v4
coreHandler((req, res, next) => {
    send(res, { hello: 'world' });
});

// v5 — return the value directly
coreHandler((event) => {
    return { hello: 'world' };
});

// v5 — return a full Response for complete control
coreHandler((event) => {
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
errorHandler((error, event) => {
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
coreHandler(async (event) => {
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
| `null` / `undefined` / `void` | No response (middleware that didn't produce output) |

To set custom status or headers without constructing a full `Response`:

```typescript
coreHandler((event) => {
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
import { Router, serve } from 'routup'; // or 'routup/node'

const router = new Router();
serve(router, { port: 3000 });

// v5 — Node.js http.createServer compatibility
import { Router, toNodeHandler } from 'routup/node';
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

### New: Body parsing

```typescript
import { readBody, readRawBody, readFormData } from 'routup';

coreHandler(async (event) => {
    const body = await readBody(event);     // auto-detects JSON, form, text
    const raw = await readRawBody(event);   // ArrayBuffer
    const form = await readFormData(event); // FormData
});
```

`readBody()` is cached — calling it multiple times returns the same parsed result.

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
| `sendCreated(res, data)` | `sendCreated(event, data)` → returns `Response` |
| `sendAccepted(res)` | `sendAccepted(event)` → returns `Response` |
| `sendRedirect(res, url)` | `sendRedirect(event, url)` → returns `Response` |
| `sendFile(res, opts)` | `sendFile(event, opts)` → returns `Response` |
| `sendStream(res, stream)` | `sendStream(event, stream)` → returns `Response` |
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

## Incremental migration with legacyHandler

If you have existing middleware or handlers you can't rewrite immediately, use the compat layer:

```typescript
import { Router } from 'routup';
import { legacyHandler, legacyErrorHandler } from 'routup/compat';

const router = new Router();

// Wrap existing (req, res, next) handlers
router.use(legacyHandler((req, res, next) => {
    // Old code works unchanged
    res.setHeader('x-legacy', 'true');
    next();
}));

// Wrap existing error handlers
router.use(legacyErrorHandler((err, req, res, next) => {
    res.statusCode = err.statusCode || 500;
    res.end(JSON.stringify({ error: err.message }));
}));

// New v5 handlers work alongside legacy ones
router.get('/new', coreHandler((event) => {
    return { style: 'v5' };
}));
```

`legacyHandler` creates synthetic Node.js `IncomingMessage`/`ServerResponse` objects from the event, so existing code that reads headers, writes to `res`, or calls `next()` continues to work.

## Import paths

| Path | Resolves to |
|------|------------|
| `routup` | Auto-selects runtime (Node on Node, Bun on Bun, etc.) |
| `routup/node` | Explicit Node.js entry with `serve()` + `toNodeHandler()` |
| `routup/bun` | Explicit Bun entry with `serve()` |
| `routup/deno` | Explicit Deno entry with `serve()` |
| `routup/generic` | Generic entry (no runtime-specific features) |
| `routup/compat` | Legacy handler compatibility layer |
