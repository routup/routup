# Helpers

Helpers are standalone, tree-shakeable functions for interacting with requests and responses. They keep the core lightweight — unused helpers are excluded from the final bundle.

## Request Helpers

| Helper | Description |
|--------|-------------|
| `getRequestHeader(event, name)` | Get a single request header |
| `getRequestHostName(event, options?)` | Get the request hostname (proxy-aware) |
| `getRequestIP(event, options?)` | Get the client IP address (proxy-aware) |
| `getRequestProtocol(event, options?)` | Get the request protocol (proxy-aware) |
| `getRequestAcceptableContentTypes(event)` | Get all acceptable content types |
| `getRequestAcceptableContentType(event, input?)` | Get best matching content type |
| `isRequestCacheable(event, modifiedTime)` | Check if the client cache is still valid |
| `matchRequestContentType(event, type)` | Check request Content-Type |
| `assertRequestContentType(event, types)` | Require a Content-Type, throw 415/400 otherwise |

## Response Helpers

| Helper | Description |
|--------|-------------|
| `sendFile(event, opts)` | Send a file with range request support |
| `sendRedirect(event, url, statusCode?)` | Redirect the client |
| `sendRedirectBack(event, options?)` | Redirect to the same-origin referer path |
| `sendStream(event, stream)` | Stream data to the client |
| `sendIterable(event, source, options?)` | Stream an iterable or async generator |
| `sendFormat(event, formats)` | Content-negotiate and send |
| `createEventStream(event, options?)` | Create a Server-Sent Events stream |
| `setResponseServerTiming(event, name, options?)` | Append a Server-Timing metric |
| `withResponseServerTiming(event, name, fn, options?)` | Time a callback and record it as a Server-Timing metric |
| `setResponseCacheHeaders(event, options?)` | Set cache-related headers |
| `setResponseHeaderAttachment(event, filename?)` | Set Content-Disposition attachment |
| `setResponseHeaderInline(event, filename?)` | Set Content-Disposition inline |
| `setResponseHeaderContentType(event, type)` | Set Content-Type header |
| `appendResponseHeader(event, name, value)` | Append to a response header |
| `createContentDisposition(filename?, options?)` | Build a Content-Disposition header value |
| `parseContentDisposition(header, options?)` | Parse a Content-Disposition header value |

## Event Properties

These are accessed directly on the event object, not through helper functions:

| Property | Description |
|----------|-------------|
| `event.request` | The underlying `ServerRequest` |
| `event.method` | HTTP method (GET, POST, etc.) |
| `event.path` | URL path |
| `event.params` | Route parameters |
| `event.headers` | Request headers (Headers object) |
| `event.searchParams` | URL search parameters (URLSearchParams) |
| `event.mountPath` | Path prefix the running handler's route consumed |
| `event.route` | The dispatched method-bound route (`path`, `pathPrefix`, `method`), or `undefined` |
| `event.response` | Response accumulator (status, headers) |
| `event.nextCalled` | Whether `event.next()` has been called |
| `event.store` | Per-request state store for data sharing |
| `event.next()` | Continue to the next handler (cached) |

See the [Request](./request.md) and [Response](./response.md) guides for detailed usage.
