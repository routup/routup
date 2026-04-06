# Request Helpers

All request helpers take an `IRoutupEvent` as the first argument.

## Body Parsing

### `readBody`

Parse the request body based on `Content-Type`. Handles `application/json` and `application/x-www-form-urlencoded`. The result is cached on the event store — subsequent calls return the same parsed value.

For binary or streaming access, use `event.request.arrayBuffer()`, `event.request.blob()`, or `event.request.body` directly.

> **Experimental**

```typescript
declare function readBody<T = unknown>(event: IRoutupEvent): Promise<T | undefined>;
```

```typescript
const data = await readBody<{ name: string }>(event);
```

## Headers & Content Negotiation

### `getRequestHeader`

Get a single request header by name.

```typescript
declare function getRequestHeader(
    event: IRoutupEvent,
    name: string,
): string | null;
```

```typescript
const auth = getRequestHeader(event, 'authorization');
```

### `matchRequestContentType`

Check whether the request's `Content-Type` matches the given type.

```typescript
declare function matchRequestContentType(
    event: IRoutupEvent,
    type: string,
): boolean;
```

```typescript
if (matchRequestContentType(event, 'application/json')) {
    // handle JSON
}
```

### `getRequestAcceptableContentTypes`

Return all content types the client accepts, from the `Accept` header.

```typescript
declare function getRequestAcceptableContentTypes(
    event: IRoutupEvent,
): string[];
```

### `getRequestAcceptableContentType`

Return the best matching content type from the `Accept` header, optionally filtered against a list of candidates.

```typescript
declare function getRequestAcceptableContentType(
    event: IRoutupEvent,
    input?: string | string[],
): string | undefined;
```

```typescript
const type = getRequestAcceptableContentType(event, [
    'application/json',
    'text/html',
]);
```

### `getRequestAcceptableCharsets`

Return all acceptable charsets from the `Accept-Charset` header.

```typescript
declare function getRequestAcceptableCharsets(
    event: IRoutupEvent,
): string[];
```

### `getRequestAcceptableCharset`

Return the best matching charset from the `Accept-Charset` header.

```typescript
declare function getRequestAcceptableCharset(
    event: IRoutupEvent,
    input: string | string[],
): string | undefined;
```

### `getRequestAcceptableEncodings`

Return all acceptable encodings from the `Accept-Encoding` header.

```typescript
declare function getRequestAcceptableEncodings(
    event: IRoutupEvent,
): string[];
```

### `getRequestAcceptableEncoding`

Return the best matching encoding from the `Accept-Encoding` header.

```typescript
declare function getRequestAcceptableEncoding(
    event: IRoutupEvent,
    input: string | string[],
): string | undefined;
```

### `getRequestAcceptableLanguages`

Return all acceptable languages from the `Accept-Language` header.

```typescript
declare function getRequestAcceptableLanguages(
    event: IRoutupEvent,
): string[];
```

### `getRequestAcceptableLanguage`

Return the best matching language from the `Accept-Language` header.

```typescript
declare function getRequestAcceptableLanguage(
    event: IRoutupEvent,
    input?: string | string[],
): string | undefined;
```

## Network

### `getRequestHostName`

Get the hostname from the request, respecting proxy headers when configured.

```typescript
declare function getRequestHostName(
    event: IRoutupEvent,
    options?: RequestHostNameOptions,
): string | undefined;
```

```typescript
const host = getRequestHostName(event, { trustProxy: true });
```

### `getRequestIP`

Get the client IP address. Uses the srvx runtime value when available, falling back to `X-Forwarded-For` header inspection when `trustProxy` is enabled.

```typescript
declare function getRequestIP(
    event: IRoutupEvent,
    options?: RequestIpOptions,
): string | undefined;
```

```typescript
const ip = getRequestIP(event, { trustProxy: true });
```

### `getRequestProtocol`

Get the request protocol (`http` or `https`), respecting proxy headers when configured.

```typescript
declare function getRequestProtocol(
    event: IRoutupEvent,
    options?: RequestProtocolOptions,
): string;
```

```typescript
const proto = getRequestProtocol(event, { trustProxy: true });
```

## Cache

### `isRequestCacheable`

Check the `If-Modified-Since` header against a modification time. Returns `true` if the client's cached version is still valid.

```typescript
declare function isRequestCacheable(
    event: IRoutupEvent,
    modifiedTime: string | Date,
): boolean;
```

```typescript
if (isRequestCacheable(event, stats.mtime)) {
    return new Response(null, { status: 304 });
}
```

## Per-Request State

Use `event.store` directly to share data between handlers. There are no helper functions for this — it is a plain `Record<string | symbol, unknown>`:

```typescript
// Set a value
event.store.userId = 42;
event.store[Symbol.for('myPlugin:data')] = { role: 'admin' };

// Read a value
const userId = event.store.userId;

// Delete a value
delete event.store.userId;
```

Use symbol keys (e.g., `Symbol.for('routup:body')`) to avoid collisions between plugins.
