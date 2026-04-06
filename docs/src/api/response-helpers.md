# Response Helpers

All response helpers take an `IRoutupEvent` as the first argument. Most send helpers return a `Response` object. Header helpers mutate `event.response.headers` in place.

## Send Helpers

### `sendRedirect`

Redirect the client to another URL. Sends an HTML body with a `<meta>` refresh as a fallback.

```typescript
declare function sendRedirect(
    event: IRoutupEvent,
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
    event: IRoutupEvent,
    options: SendFileOptions,
): Promise<Response>;
```

The `SendFileOptions` type:

```typescript
type SendFileOptions = {
    stats: () => Promise<SendFileStats> | SendFileStats;
    content: (
        options: SendFileContentOptions,
    ) => Promise<ReadableStream | ArrayBuffer | Uint8Array> | ReadableStream | ArrayBuffer | Uint8Array;
    attachment?: boolean;
    name?: string;
};
```

```typescript
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

return await sendFile(event, {
    stats: () => fs.stat(filePath),
    content: (opts) => Readable.toWeb(createReadStream(filePath, opts)) as ReadableStream,
    name: 'report.pdf',
});
```

### `sendStream`

Wrap a `ReadableStream` in a `Response`.

```typescript
declare function sendStream(
    event: IRoutupEvent,
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
    event: IRoutupEvent,
    data?: unknown,
): Promise<Response>;
```

```typescript
return sendCreated(event, { id: 1, name: 'New Item' });
```

### `sendAccepted`

Send a `202 Accepted` response with optional body data.

```typescript
declare function sendAccepted(
    event: IRoutupEvent,
    data?: unknown,
): Promise<Response>;
```

```typescript
return sendAccepted(event, { status: 'processing' });
```

### `sendFormat`

Perform content negotiation and send the response in the format the client prefers. Falls back to the `default` handler if no format matches.

```typescript
declare function sendFormat(
    event: IRoutupEvent,
    formats: {
        default: () => unknown;
        [contentType: string]: () => unknown;
    },
): Response | unknown | undefined;
```

```typescript
return sendFormat(event, {
    default: () => ({ ok: true }),
    'application/json': () => ({ ok: true }),
    'text/html': () => '<p>OK</p>',
});
```

## Header Helpers

### `setResponseHeaderAttachment`

Set the `Content-Disposition` header to `attachment`. When a filename is provided, adds the `filename` directive and sets `Content-Type` based on the file extension.

```typescript
declare function setResponseHeaderAttachment(
    event: IRoutupEvent,
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
    event: IRoutupEvent,
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
    event: IRoutupEvent,
    options?: ResponseCacheHeadersOptions,
): void;
```

The `ResponseCacheHeadersOptions` type:

```typescript
type ResponseCacheHeadersOptions = {
    maxAge?: number;
    modifiedTime?: string | Date;
    cacheControls?: string[];
};
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
    event: IRoutupEvent,
    name: string,
    value: string | string[],
): void;
```

```typescript
appendResponseHeader(event, 'Set-Cookie', 'session=abc; Path=/');
```

### `appendResponseHeaderDirective`

Append a directive to an existing response header value (or create the header). Deduplicates directives.

```typescript
declare function appendResponseHeaderDirective(
    event: IRoutupEvent,
    name: string,
    value: string | string[],
): void;
```

```typescript
appendResponseHeaderDirective(event, 'Cache-Control', 'no-cache');
```

## Status Helpers

### `isResponseGone`

Check whether the response has already been dispatched (i.e., `event.dispatched` is `true`).

```typescript
declare function isResponseGone(event: IRoutupEvent): boolean;
```

### `setResponseGone`

Mark the response as dispatched.

```typescript
declare function setResponseGone(event: IRoutupEvent): void;
```

## Event Stream (SSE)

### `createEventStream`

Create a Server-Sent Events stream. Returns a handle with methods to write events, end the stream, and the underlying `Response`.

```typescript
declare function createEventStream(
    event: IRoutupEvent,
    options?: EventStreamOptions,
): EventStreamHandle;
```

The `EventStreamOptions` type:

```typescript
type EventStreamOptions = {
    maxMessageSize?: number;
};
```

The `EventStreamHandle` type:

```typescript
type EventStreamHandle = {
    write(message: string | EventStreamMessage): void;
    end(): void;
    response: Response;
};

type EventStreamMessage = {
    id?: string;
    retry?: number;
    data: string;
    event?: string;
};
```

```typescript
import { defineCoreHandler, createEventStream } from 'routup';

defineCoreHandler((event) => {
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
    event: IRoutupEvent,
    fileName: string,
): void;
```

```typescript
setResponseContentTypeByFileName(event, 'image.png');
```
