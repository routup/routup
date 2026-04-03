# Request Helpers

All request helpers take a `DispatchEvent` as the first argument.

## Body Parsing

### `readBody`

Parse the request body based on `Content-Type` (JSON, form-urlencoded, or text). The result is cached — subsequent calls return the same parsed value.

```typescript
declare function readBody<T = unknown>(event: DispatchEvent): Promise<T>;
```

```typescript
const data = await readBody<{ name: string }>(event);
```

### `readRawBody`

Read the raw request body as an `ArrayBuffer`. Not cached.

```typescript
declare function readRawBody(event: DispatchEvent): Promise<ArrayBuffer>;
```

```typescript
const buffer = await readRawBody(event);
```

### `readFormData`

Read the request body as `FormData`. Not cached.

```typescript
declare function readFormData(event: DispatchEvent): Promise<FormData>;
```

```typescript
const form = await readFormData(event);
const file = form.get('avatar');
```

## Headers & Content Negotiation

### `getRequestHeader`

Get a single request header by name.

```typescript
declare function getRequestHeader(
    event: DispatchEvent,
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
    event: DispatchEvent,
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
    event: DispatchEvent,
): string[];
```

### `getRequestAcceptableContentType`

Return the best matching content type from the `Accept` header, optionally filtered against a list of candidates.

```typescript
declare function getRequestAcceptableContentType(
    event: DispatchEvent,
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
    event: DispatchEvent,
): string[];
```

### `getRequestAcceptableCharset`

Return the best matching charset from the `Accept-Charset` header.

```typescript
declare function getRequestAcceptableCharset(
    event: DispatchEvent,
    input: string | string[],
): string | undefined;
```

### `getRequestAcceptableEncodings`

Return all acceptable encodings from the `Accept-Encoding` header.

```typescript
declare function getRequestAcceptableEncodings(
    event: DispatchEvent,
): string[];
```

### `getRequestAcceptableEncoding`

Return the best matching encoding from the `Accept-Encoding` header.

```typescript
declare function getRequestAcceptableEncoding(
    event: DispatchEvent,
    input: string | string[],
): string | undefined;
```

### `getRequestAcceptableLanguages`

Return all acceptable languages from the `Accept-Language` header.

```typescript
declare function getRequestAcceptableLanguages(
    event: DispatchEvent,
): string[];
```

### `getRequestAcceptableLanguage`

Return the best matching language from the `Accept-Language` header.

```typescript
declare function getRequestAcceptableLanguage(
    event: DispatchEvent,
    input?: string | string[],
): string | undefined;
```

## Network

### `getRequestHostName`

Get the hostname from the request, respecting proxy headers when configured.

```typescript
declare function getRequestHostName(
    event: DispatchEvent,
    options?: RequestHostNameOptions,
): string | undefined;
```

```typescript
const host = getRequestHostName(event, { trustProxy: true });
```

### `getRequestIP`

Get the client IP address. Uses the srvx runtime value when available, falling back to header inspection.

```typescript
declare function getRequestIP(
    event: DispatchEvent,
    options?: RequestIPOptions,
): string | undefined;
```

```typescript
const ip = getRequestIP(event, { trustProxy: true });
```

### `getRequestProtocol`

Get the request protocol (`http` or `https`), respecting proxy headers when configured.

```typescript
declare function getRequestProtocol(
    event: DispatchEvent,
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
    event: DispatchEvent,
    modifiedTime: string | Date,
): boolean;
```

```typescript
if (isRequestCacheable(event, stats.mtime)) {
    return new Response(null, { status: 304 });
}
```

## Environment (Metadata)

Attach arbitrary metadata to a `DispatchEvent` for use by downstream handlers.

### `setRequestEnv`

Set one or more metadata values on the event.

```typescript
// Single key-value
declare function setRequestEnv(
    event: DispatchEvent,
    key: string,
    value: unknown,
): void;

// Multiple key-values
declare function setRequestEnv(
    event: DispatchEvent,
    record: Record<string, unknown>,
    append?: boolean,
): void;
```

```typescript
setRequestEnv(event, 'userId', 42);
setRequestEnv(event, { role: 'admin', org: 'acme' });
```

### `useRequestEnv`

Read metadata from the event.

```typescript
// All metadata
declare function useRequestEnv(
    event: DispatchEvent,
): Record<string, unknown>;

// Single key
declare function useRequestEnv(
    event: DispatchEvent,
    key: string,
): unknown;
```

```typescript
const userId = useRequestEnv(event, 'userId');
const all = useRequestEnv(event);
```

### `unsetRequestEnv`

Remove a metadata key from the event.

```typescript
declare function unsetRequestEnv(
    event: DispatchEvent,
    key: string,
): void;
```

```typescript
unsetRequestEnv(event, 'tempData');
```
