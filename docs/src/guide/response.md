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

// ArrayBuffer — sent as binary
coreHandler(() => new ArrayBuffer(8));

// null — empty 204 No Content
coreHandler(() => null);
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

## Response Helpers

Routup provides helper functions for common response patterns:

### sendFile

Send a file to the client:

```typescript
import { coreHandler, sendFile } from 'routup';

router.get('/download', coreHandler(async (event) => {
    return sendFile(event, {
        stats: () => fs.promises.stat('/path/to/file.pdf'),
        content: (opts) => {
            const stream = fs.createReadStream('/path/to/file.pdf', opts);
            return Readable.toWeb(stream);
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

router.post('/users', coreHandler((event) => {
    return sendCreated(event, { id: 1 });
}));
```

### sendAccepted

Send a 202 Accepted response:

```typescript
import { coreHandler, sendAccepted } from 'routup';

router.post('/jobs', coreHandler((event) => {
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
