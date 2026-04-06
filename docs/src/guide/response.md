# Response

In routup v5, responses are return-based. Handlers return a value, and routup converts it to a `Response` object automatically.

## Return Values

```typescript
// String — text/plain
coreHandler(() => 'Hello, World!');

// Object or Array — application/json
coreHandler(() => ({ users: [] }));

// Response — used as-is
coreHandler(() => new Response('Created', { status: 201 }));

// ReadableStream — streamed to client
coreHandler(() => someReadableStream);

// Blob — sent with appropriate content type
coreHandler(() => new Blob(['data'], { type: 'text/plain' }));

// ArrayBuffer / Uint8Array — sent as binary
coreHandler(() => new ArrayBuffer(8));

// null — empty response
coreHandler(() => null);

// undefined — middleware pass-through (pipeline continues)
coreHandler(() => undefined);
```

## Status and Headers

Use `event.response` to set status codes and headers before returning:

```typescript
coreHandler((event) => {
    event.response.status = 201;
    event.response.headers.set('X-Custom', 'value');
    return { created: true };
});
```

> **Note:** `event.response` settings are ignored when you return a `Response` object directly.

## Response Helpers

Routup provides helper functions for common response patterns:

### sendFile

Send a file with support for range requests, ETag generation, and automatic content-type detection:

```typescript
import { coreHandler, sendFile } from 'routup';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

router.get('/download', coreHandler(async (event) => {
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
import { coreHandler, sendRedirect } from 'routup';

router.get('/old', coreHandler((event) => {
    return sendRedirect(event, '/new');
}));
```

### sendCreated

Send a 201 Created response:

```typescript
import { coreHandler, sendCreated } from 'routup';

router.post('/users', coreHandler(async (event) => {
    return sendCreated(event, { id: 1 });
}));
```

### sendAccepted

Send a 202 Accepted response:

```typescript
import { coreHandler, sendAccepted } from 'routup';

router.post('/jobs', coreHandler(async (event) => {
    return sendAccepted(event);
}));
```

### sendStream

Stream data to the client:

```typescript
import { coreHandler, sendStream } from 'routup';

router.get('/stream', coreHandler((event) => {
    return sendStream(event, readableStream);
}));
```

### sendFormat

Content-negotiate and send a response in the appropriate format:

```typescript
import { coreHandler, sendFormat } from 'routup';

router.get('/data', coreHandler((event) => {
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
import { coreHandler, createEventStream } from 'routup';

router.get('/events', coreHandler((event) => {
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
