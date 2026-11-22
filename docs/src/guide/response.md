# Response

In routup v5, responses are return-based. Handlers return a value, and routup converts it to a `Response` object automatically.

## Return Values

```typescript
// String — text/plain
defineCoreHandler(() => 'Hello, World!');

// Object or Array — application/json
defineCoreHandler(() => ({ users: [] }));

// Response — used as-is
defineCoreHandler(() => new Response('Created', { status: 201 }));

// ReadableStream — streamed to client
defineCoreHandler(() => someReadableStream);

// Generator / async generator / async iterable — streamed, one chunk per yielded value
// (no default Content-Type; arrays, Set, Map and plain objects stay JSON, unless an
// object has a callable Symbol.asyncIterator, or Symbol.iterator plus a next() method)
defineCoreHandler(async function* () {
    yield 'chunk 1';
    yield 'chunk 2';
});

// Blob — sent with appropriate content type
defineCoreHandler(() => new Blob(['data'], { type: 'text/plain' }));

// ArrayBuffer / Uint8Array — sent as binary
defineCoreHandler(() => new ArrayBuffer(8));

// null — empty response
defineCoreHandler(() => null);
```

### Returning `undefined`

`undefined` is not an empty response; return `null` for one. See [Returning `undefined`](/guide/timeouts#returning-undefined).

## Status and Headers

Use `event.response` to set status codes and headers before returning:

```typescript
defineCoreHandler((event) => {
    event.response.status = 201;
    event.response.headers.set('X-Custom', 'value');
    return { created: true };
});
```

> **Note:** `event.response` settings are ignored when you return a `Response` object directly.

## Response Helpers

App provides helper functions for common response patterns:

### sendFile

Send a file with support for range requests, ETag generation, conditional requests, and automatic content-type detection. A conditional `GET` or `HEAD` request whose cached copy is still fresh gets `304 Not Modified` without the file content being read:

```typescript
import { defineCoreHandler, sendFile } from 'routup';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

app.get('/download', defineCoreHandler(async (event) => {
    return sendFile(event, {
        stats: () => fs.stat('/path/to/file.pdf'),
        content: (opts) => {
            return Readable.toWeb(createReadStream('/path/to/file.pdf', opts)) as ReadableStream;
        },
        name: 'file.pdf',
    });
}));
```

### sendRedirect

Redirect the client to another URL:

```typescript
import { defineCoreHandler, sendRedirect } from 'routup';

app.get('/old', defineCoreHandler((event) => {
    return sendRedirect(event, '/new');
}));
```

### sendStream

Stream data to the client:

```typescript
import { defineCoreHandler, sendStream } from 'routup';

app.get('/stream', defineCoreHandler((event) => {
    return sendStream(event, readableStream);
}));
```

### sendIterable

Stream an iterable, async iterable or generator. A generator returned from a handler streams the same way; use `sendIterable` for a custom serializer. A throw before the first `yield` is handled as a normal error:

```typescript
import { defineCoreHandler, sendIterable } from 'routup';

app.get('/events', defineCoreHandler((event) => {
    return sendIterable(event, source(), { serializer: (value) => `${JSON.stringify(value)}\n` });
}));
```

### sendFormat

Content-negotiate and send a response in the appropriate format:

```typescript
import { defineCoreHandler, sendFormat } from 'routup';

app.get('/data', defineCoreHandler((event) => {
    return sendFormat(event, {
        default: () => 'key=value',
        'application/json': () => ({ key: 'value' }),
        'text/plain': () => 'key=value',
    });
}));
```

### createEventStream

Create a Server-Sent Events (SSE) stream:

```typescript
import { defineCoreHandler, createEventStream } from 'routup';

app.get('/events', defineCoreHandler((event) => {
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
}));
```

Idle connections are often closed by proxies. Send a comment as a keep-alive; clients ignore it:

```typescript
const ping = setInterval(() => {
    if (!stream.writeComment('ping')) {
        clearInterval(ping);
    }
}, 15_000);
```

The [Server-Sent Events example](/examples/server-sent-events) streams events to a client.
