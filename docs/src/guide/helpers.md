# Helpers

Helpers are standalone, tree-shakeable functions for interacting with requests and responses. They keep the core lightweight — unused helpers are excluded from the final bundle.

## Request Helpers

| Helper | Description |
|--------|-------------|
| `readBody(event)` | Parse request body (JSON, form, text) with caching |
| `getRequestHostName(event)` | Get the request hostname |
| `getRequestIP(event)` | Get the client IP address (proxy-aware) |
| `useRequestEnv(event, key)` | Read shared data from the event |
| `setRequestEnv(event, key, value)` | Store shared data on the event |

## Response Helpers

| Helper | Description |
|--------|-------------|
| `sendFile(event, opts)` | Send a file to the client |
| `sendRedirect(event, url)` | Redirect the client |
| `sendCreated(event, data?)` | Send a 201 Created response |
| `sendAccepted(event, data?)` | Send a 202 Accepted response |
| `sendStream(event, stream)` | Stream data to the client |
| `sendFormat(event, formats)` | Content-negotiate and send |

## Event Properties

These are accessed directly on the `DispatchEvent`, not through helper functions:

| Property | Description |
|----------|-------------|
| `event.request` | The underlying `ServerRequest` (srvx) |
| `event.method` | HTTP method (GET, POST, etc.) |
| `event.path` | URL path |
| `event.params` | Route parameters |
| `event.headers` | Request headers |
| `event.searchParams` | URL search parameters |
| `event.mountPath` | Mount path prefix |
| `event.response` | Response accumulator (status, headers) |
| `event.next()` | Continue to the next handler |

See the [Request](./request.md) and [Response](./response.md) guides for detailed usage.
