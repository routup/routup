# Response Helpers

All response helpers take a `DispatchEvent` as the first argument. Send helpers return a `Response` object. Header helpers mutate `event.response.headers` in place.

## Send Helpers

### `sendRedirect`

Redirect the client to another URL. Sends an HTML body with a `<meta>` refresh as a fallback.

```typescript
declare function sendRedirect(
    event: DispatchEvent,
    location: string,
    statusCode?: number,
): Response;
```

```typescript
return sendRedirect(event, '/login', 302);
```

### `sendFile`

Send a file with support for range requests, ETag generation, and automatic content-type detection.

```typescript
declare function sendFile(
    event: DispatchEvent,
    options: SendFileOptions,
): Promise<Response>;
```

```typescript
return await sendFile(event, {
    stats: () => fs.stat(filePath),
    content: (opts) => fs.createReadStream(filePath, opts),
    name: 'report.pdf',
});
```

### `sendStream`

Wrap a `ReadableStream` in a `Response`.

```typescript
declare function sendStream(
    event: DispatchEvent,
    stream: ReadableStream,
): Response;
```

```typescript
const stream = new ReadableStream({ /* ... */ });
return sendStream(event, stream);
```

### `sendCreated`

Send a `201 Created` response with optional body data.

```typescript
declare function sendCreated(
    event: DispatchEvent,
    data?: unknown,
): Response;
```

```typescript
return sendCreated(event, { id: 1, name: 'New Item' });
```

### `sendAccepted`

Send a `202 Accepted` response with optional body data.

```typescript
declare function sendAccepted(
    event: DispatchEvent,
    data?: unknown,
): Response;
```

```typescript
return sendAccepted(event, { status: 'processing' });
```

### `sendFormat`

Perform content negotiation and send the response in the format the client prefers. Returns `undefined` if no format matches.

```typescript
declare function sendFormat(
    event: DispatchEvent,
    formats: Record<string, () => Response>,
): Response | undefined;
```

```typescript
return sendFormat(event, {
    'application/json': () => Response.json({ ok: true }),
    'text/html': () => new Response('<p>OK</p>', {
        headers: { 'Content-Type': 'text/html' },
    }),
});
```

## Header Helpers

### `setResponseHeaderAttachment`

Set the `Content-Disposition` header to `attachment`. When a filename is provided, adds the `filename` directive and sets `Content-Type` based on the file extension.

```typescript
declare function setResponseHeaderAttachment(
    event: DispatchEvent,
    filename?: string,
): void;
```

```typescript
setResponseHeaderAttachment(event, 'data.csv');
```

### `setResponseHeaderContentType`

Set the `Content-Type` response header. Optionally skip if a content type is already set.

```typescript
declare function setResponseHeaderContentType(
    event: DispatchEvent,
    type: string,
    ifNotExists?: boolean,
): void;
```

```typescript
setResponseHeaderContentType(event, 'application/json');
```

### `setResponseCacheHeaders`

Set `Cache-Control` and `Last-Modified` headers based on the provided options.

```typescript
declare function setResponseCacheHeaders(
    event: DispatchEvent,
    options?: ResponseCacheHeadersOptions,
): void;
```

```typescript
setResponseCacheHeaders(event, {
    maxAge: 3600,
    modifiedTime: stats.mtime,
});
```

### `appendResponseHeader`

Append a value to an existing response header (or create it).

```typescript
declare function appendResponseHeader(
    event: DispatchEvent,
    name: string,
    value: string,
): void;
```

```typescript
appendResponseHeader(event, 'Set-Cookie', 'session=abc; Path=/');
```

### `appendResponseHeaderDirective`

Append a directive to an existing response header value (or create the header).

```typescript
declare function appendResponseHeaderDirective(
    event: DispatchEvent,
    name: string,
    value: string,
): void;
```

```typescript
appendResponseHeaderDirective(event, 'Cache-Control', 'no-cache');
```

## Status Helpers

### `isResponseGone`

Check whether the response has already been dispatched.

```typescript
declare function isResponseGone(event: DispatchEvent): boolean;
```

### `setResponseGone`

Mark the response as dispatched.

```typescript
declare function setResponseGone(event: DispatchEvent): void;
```

## Event Stream (SSE)

### `createEventStream`

Create a Server-Sent Events stream. Returns an object with methods to write events, end the stream, and the underlying `Response`.

```typescript
declare function createEventStream(
    event: DispatchEvent,
    options?: EventStreamOptions,
): { write: (data: string) => void; end: () => void; response: Response };
```

```typescript
import { coreHandler, createEventStream } from 'routup';

coreHandler((event) => {
    const stream = createEventStream(event);

    let count = 0;
    const interval = setInterval(() => {
        stream.write(`count: ${count}`);
        count++;

        if (count > 100) {
            stream.end();
            clearInterval(interval);
        }
    }, 1000);

    return stream.response;
});
```

## Utility

### `setResponseContentTypeByFileName`

Set the `Content-Type` header based on a file's extension.

```typescript
declare function setResponseContentTypeByFileName(
    event: DispatchEvent,
    fileName: string,
): void;
```

```typescript
setResponseContentTypeByFileName(event, 'image.png');
```
