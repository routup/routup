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

## Response Helpers

| Helper | Description |
|--------|-------------|
| `sendFile(event, opts)` | Send a file with range request support |
| `sendRedirect(event, url, statusCode?)` | Redirect the client |
| `sendCreated(event, data?)` | Send a 201 Created response |
| `sendAccepted(event, data?)` | Send a 202 Accepted response |
| `sendStream(event, stream)` | Stream data to the client |
| `sendFormat(event, formats)` | Content-negotiate and send |
| `createEventStream(event, options?)` | Create a Server-Sent Events stream |
| `setResponseCacheHeaders(event, options?)` | Set cache-related headers |
| `setResponseHeaderAttachment(event, filename?)` | Set Content-Disposition attachment |
| `setResponseHeaderContentType(event, type)` | Set Content-Type header |
| `appendResponseHeader(event, name, value)` | Append to a response header |

## Event Properties

These are accessed directly on the event object, not through helper functions:

| Property | Description |
|----------|-------------|
| `event.request` | The underlying `ServerRequest` (srvx) |
| `event.method` | HTTP method (GET, POST, etc.) |
| `event.path` | URL path |
| `event.params` | Route parameters |
| `event.headers` | Request headers (Headers object) |
| `event.searchParams` | URL search parameters (URLSearchParams) |
| `event.mountPath` | Mount path prefix |
| `event.response` | Response accumulator (status, headers, statusText) |
| `event.dispatched` | Whether a response has been produced |
| `event.store` | Per-request state store for data sharing |
| `event.next()` | Continue to the next handler (cached) |

See the [Request](./request.md) and [Response](./response.md) guides for detailed usage.
