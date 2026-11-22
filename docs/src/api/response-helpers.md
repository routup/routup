# Response Helpers

All response helpers take an `IAppEvent` as the first argument. Most send helpers return a `Response` object. Header helpers mutate `event.response.headers` in place.

## Send Helpers

### `sendRedirect`

Redirect the client to another URL. Sends an HTML body with a `<meta>` refresh as a fallback.

```typescript
declare function sendRedirect(
    event: IAppEvent,
    location: string,
    statusCode?: number,
): Response;
```

```typescript
return sendRedirect(event, '/login', 302);
```

### `sendRedirectBack`

Redirect the client back to the page it came from. The `Referer` is used only when its origin equals the request origin (protocol and host with port, taking `X-Forwarded-Proto` and `X-Forwarded-Host` into account only for a trusted proxy). Only its path is used, never the absolute URL, and leading slashes collapse so a path cannot become a protocol-relative URL. Otherwise the client goes to `fallback`.

| Option | Default | Description |
|--------|---------|-------------|
| `fallback` | `'/'` | Location without a same-origin referer. Must be a trusted value, never user input |
| `status` | `302` | Redirect status code |
| `allowQuery` | `false` | Keep the query string of the referer |

```typescript
declare function sendRedirectBack(
    event: IAppEvent,
    options?: SendRedirectBackOptions,
): Response;
```

```typescript
type SendRedirectBackOptions = {
    fallback?: string,
    status?: number,
    allowQuery?: boolean,
};
```

```typescript
return sendRedirectBack(event, { fallback: '/login' });
```

### `sendFile`

Send a file with support for range requests, ETag generation, and automatic content-type detection.

`Content-Type` comes from `type` when given. Otherwise the extension of the file name sets it only when no `content-type` is set yet, so a type the handler set (for example a sniffed one) is kept. A `416 Range Not Satisfiable` answer carries no `Content-Type` or `Content-Disposition`.

It sets `ETag` and `Last-Modified` from the file stats and answers a conditional `GET` or `HEAD` request (`If-None-Match`, or `If-Modified-Since` without `If-None-Match`) whose cached copy is still fresh with `304 Not Modified`, without reading the file content. This applies only while `event.response.status` is a 2xx; a file sent as an error or redirect body keeps that status.

```typescript
declare function sendFile(
    event: IAppEvent,
    options: SendFileOptions,
): Promise<Response>;
```

The `SendFileOptions` type:

```typescript
type SendFileOptions = {
    stats: (() => Promise<SendFileStats> | SendFileStats) | SendFileStats;
    content: (options: SendFileContentOptions) => Promise<SendFileContent> | SendFileContent;
    disposition?: SendFileDisposition;
    /** @deprecated Use `disposition: 'attachment'` instead. */
    attachment?: boolean;
    name?: string;
    /** Content type; wins over a set `content-type` and over the name. */
    type?: string;
};

type SendFileStats = {
    size?: number;
    mtime?: Date | number | string;
    name?: string;
};

type SendFileContentOptions = {
    start?: number;
    end?: number;
};

type SendFileContent = ReadableStream | ArrayBuffer | Uint8Array;

type SendFileDisposition = 'attachment' | 'inline';
```

```typescript
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

return await sendFile(event, {
    stats: () => fs.stat(filePath),
    content: (opts) => Readable.toWeb(createReadStream(filePath, opts)) as ReadableStream,
    name: 'report.pdf',
    disposition: 'attachment', // 'inline' to render in-browser with a suggested save name
});
```

### `sendStream`

Wrap a `ReadableStream` in a `Response`.

```typescript
declare function sendStream(
    event: IAppEvent,
    stream: ReadableStream,
): Response;
```

```typescript
const stream = new ReadableStream({ /* ... */ });
return sendStream(event, stream);
```

### `sendIterable`

Stream an iterable, async iterable, iterator or generator. The first chunk is pulled before the `Response` is built, so a throw before the first `yield` is a normal handler error. Cancelling the response calls the iterator's `return()`. No default `Content-Type` is set. Handlers returning a generator or async iterable are streamed the same way.

Default serialization: strings become UTF-8, `Uint8Array` and other buffers are sent as bytes, `number`/`boolean`/`bigint` use `String()`, other objects use `JSON.stringify`, and `undefined`, functions and symbols are skipped.

```typescript
declare function sendIterable(
    event: IAppEvent,
    source: Iterable<unknown> | AsyncIterable<unknown> | Iterator<unknown> | AsyncIterator<unknown> | (() => Iterator<unknown> | AsyncIterator<unknown>),
    options?: { serializer?: (value: unknown) => Uint8Array | string | undefined },
): Promise<Response>;
```

```typescript
type IterableSerializer = (value: unknown) => Uint8Array | string | undefined;

type IterableSource =
    Iterable<unknown> |
    AsyncIterable<unknown> |
    Iterator<unknown> |
    AsyncIterator<unknown> |
    (() => Iterator<unknown> | AsyncIterator<unknown>);

type SendIterableOptions = {
    serializer?: IterableSerializer,
};
```

### `isStreamableIterable`

Whether a handler return value is streamed like `sendIterable` instead of serialized as JSON: an object or function with a callable `Symbol.asyncIterator`, or one with a callable `Symbol.iterator` and a `next()` method (a generator). Arrays, strings, typed arrays, `Map` and `Set` are iterable but have no `next()`, so they return `false`, as do `Response` and `ReadableStream`.

```typescript
declare function isStreamableIterable(value: unknown): value is object;
```

### `sendFormat`

Perform content negotiation and send the response in the format the client prefers. Falls back to the `default` handler if no format matches.

```typescript
declare function sendFormat(
    event: IAppEvent,
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

Set the `Content-Disposition` header to `attachment`. When a filename is provided, adds the `filename` (and, for non-ASCII names, `filename*=UTF-8''…`) directive per RFC 6266 and, when no `content-type` is set yet, sets `Content-Type` based on the file extension.

```typescript
declare function setResponseHeaderAttachment(
    event: IAppEvent,
    filename?: string,
): void;
```

```typescript
setResponseHeaderAttachment(event, 'data.csv');
// Content-Disposition: attachment; filename=data.csv
```

### `setResponseHeaderInline`

Set the `Content-Disposition` header to `inline`. When a filename is provided, adds the `filename` (and, for non-ASCII names, `filename*=UTF-8''…`) directive per RFC 6266 and, when no `content-type` is set yet, sets `Content-Type` based on the file extension, following the same encoding rules as `setResponseHeaderAttachment`. Use this when you want the browser to render the response natively (PDF viewer, image, video) but still suggest a filename if the user later saves it.

```typescript
declare function setResponseHeaderInline(
    event: IAppEvent,
    filename?: string,
): void;
```

```typescript
setResponseHeaderInline(event, 'invoice.pdf');
// Content-Disposition: inline; filename=invoice.pdf
```

### `createContentDisposition`

Build a `Content-Disposition` header value as a string, with RFC 6266 / RFC 5987 encoding for non-US-ASCII filenames. Pure function — does not touch the event. Use this when you need the raw header value (e.g. inside a multipart writer) rather than mutating `event.response.headers`.

```typescript
declare function createContentDisposition(
    filename?: string,
    options?: ContentDispositionCreateOptions,
): string;

type ContentDispositionCreateOptions = {
    type?: ContentDispositionType; // default: 'attachment'
    fallback?: string | boolean;   // default: true
};

type ContentDispositionType = 'attachment' | 'inline' | (string & {});
```

```typescript
createContentDisposition('plans.pdf');
// 'attachment; filename=plans.pdf'

createContentDisposition('€ rates.pdf', { type: 'inline' });
// "inline; filename=\"? rates.pdf\"; filename*=UTF-8''%E2%82%AC%20rates.pdf"
```

### `parseContentDisposition`

Parse a `Content-Disposition` header value into its type and parameters, decoding RFC 5987 / RFC 8187 extended parameters by default. Accepts `null` / `undefined` (as returned by `Headers.get()` when the header is absent) and returns `null` in that case, so callers don't need a separate null-check.

```typescript
declare function parseContentDisposition(
    header: string,
    options?: ContentDispositionParseOptions,
): ContentDisposition;
declare function parseContentDisposition(
    header: string | null | undefined,
    options?: ContentDispositionParseOptions,
): ContentDisposition | null;

type ContentDisposition = {
    type: string;
    parameters: Record<string, string>;
};

type ContentDispositionParseOptions = {
    extended?: boolean;  // decode filename*=; default: true
    multipart?: boolean; // multipart/form-data grammar; default: false
};
```

```typescript
parseContentDisposition('attachment; filename="plans.pdf"');
// { type: 'attachment', parameters: { filename: 'plans.pdf' } }

parseContentDisposition("attachment; filename*=UTF-8''%E2%82%AC%20rates.pdf");
// { type: 'attachment', parameters: { filename: '€ rates.pdf' } }

parseContentDisposition(event.request.headers.get('content-disposition'));
// null when the header is missing
```

If the underlying parser throws, the error is rethrown as an `AppError` with HTTP status `400` and the original error attached as `cause` — suitable for surfacing through routup's error handler when parsing untrusted request headers.

### `setResponseHeaderContentType`

Set the `Content-Type` response header. Optionally skip if a content type is already set.

```typescript
declare function setResponseHeaderContentType(
    event: IAppEvent,
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
    event: IAppEvent,
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

### `setResponseServerTiming`

Append a metric to the `Server-Timing` response header. Each call appends, so several metrics accumulate in order. Only a response built from `event.response` carries the header; a handler that returns its own `Response` does not.

`name` must be a valid header token and `dur` a finite number of milliseconds `>= 0`, otherwise a `TypeError` is thrown. `desc` is quoted and its `\` and `"` are escaped; a `desc` with a control character (other than tab) or a code point above `0xFF` throws a `TypeError`.

```typescript
declare function setResponseServerTiming(
    event: IAppEvent,
    name: string,
    options?: ResponseServerTimingOptions,
): void;
```

```typescript
type ResponseServerTimingOptions = {
    dur?: number,
    desc?: string,
};
```

```typescript
setResponseServerTiming(event, 'db', { dur: 53.2, desc: 'query' });
// Server-Timing: db;desc="query";dur=53.2
```

### `withResponseServerTiming`

Run a callback, measure it with `performance.now()` and record it as a metric. `name` and `desc` are validated before the callback runs. A throwing callback is still recorded and the error re-thrown. Resolves with the callback's value.

```typescript
declare function withResponseServerTiming<T>(
    event: IAppEvent,
    name: string,
    fn: () => T | Promise<T>,
    options?: Pick<ResponseServerTimingOptions, 'desc'>,
): Promise<T>;
```

```typescript
const user = await withResponseServerTiming(event, 'db', () => loadUser(id));
```

### `appendResponseHeader`

Append a value to an existing response header (or create it).

```typescript
declare function appendResponseHeader(
    event: IAppEvent,
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
    event: IAppEvent,
    name: string,
    value: string | string[],
): void;
```

```typescript
appendResponseHeaderDirective(event, 'Cache-Control', 'no-cache');
```

## Event Stream (SSE)

### `createEventStream`

Create a Server-Sent Events stream. Returns a handle with methods to write events, end the stream, and the underlying `Response`.

```typescript
declare function createEventStream(
    event: IAppEvent,
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
    write(message: string | EventStreamMessage): boolean;
    writeComment(comment: string): boolean;
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

`write()` and `writeComment()` return `false` when the stream is closed or the serialized chunk exceeds `maxMessageSize`. `writeComment()` writes a comment line (`: ping`), which clients ignore; use it as a keep-alive so proxies do not close an idle connection. An `id` of `''` resets the client's last event ID.

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
    event: IAppEvent,
    fileName: string,
): void;
```

```typescript
setResponseContentTypeByFileName(event, 'image.png');
```
