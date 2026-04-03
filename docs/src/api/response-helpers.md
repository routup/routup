# Response Helpers

## `setResponseCacheHeaders`

Set cache headers (`last-modified` & `cache-control`) depending on the
options input.

```typescript
declare function setResponseCacheHeaders(
    res: Response,
    options?: ResponseCacheHeadersOptions
);

type ResponseCacheHeadersOptions = {
    maxAge?: number,
    modifiedTime?: string | Date,
    cacheControls?: string[]
};
```

## `appendResponseHeaderDirective`

Append a header directive to an existent response header.
If the header is not present in the response, then the header will be created.

```typescript
declare function appendResponseHeaderDirective(
    res: ServerResponse,
    name: string,
    value: OutgoingHttpHeader,
) 
```

## `setResponseHeaderAttachment`

Set the `Content-Disposition` response header and adds the filename directive,
if a filename is provided as function argument.
In addition, it sets the `Content-Type` based on the extension of the filename.

```typescript
declare function setResponseHeaderAttachment(
    res: ServerResponse,
    filename?: string
);
```

## `setResponseHeaderContentType`

Set the `Content-Type` response header.

```typescript
declare function setResponseHeaderContentType(
    res: ServerResponse,
    input: string,
    ifNotExists?: boolean
);
```

## `send`

Send is properly the most important response helper. It accepts any input data (optional),
as argument and negotiate the content-type of the input data and sends
a formatted response to client.

```typescript
declare async function send(res: Response, chunk?: any) : Promise<void>;
```

## `sendFile`

Send a local file to the client.

```typescript
type SendFileContentOptions = {
    end?: number,
    start?: number;
};

type SendFileStats = {
    size?: number,
    mtime?: Date | number | string,
    name?: string
};

type SendFileOptions = {
    stats: () => Promise<SendFileStats> | SendFileStats,
    content: (
        options: SendFileContentOptions
    ) => Promise<unknown> | unknown
    attachment?: boolean,
    name?: string
};

declare function sendFile(
    res: ServerResponse,
    options: SendFileOptions,
    fn?: Next
);
```

## `sendRedirect`

Redirect the client to another location.

```typescript
declare function sendRedirect(
    res: Response,
    location: string,
    statusCode = 302
)
```

## `sendStream`

Send a readable stream to the client.

```typescript
declare function sendStream(
    res: Response,
    stream: Readable | ReadableStream,
    fn?: Next
) 
```

## `ServerSentEvents`

Create an EventStream instance for enabling [server sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)

```typescript
declare function createEventStream(
    res: Response
) : EventStream;
```

**`Example`**

```ts
import { coreHandler, createEventStream } from 'routup';

coreHandler((req, res) => {
    const eventStream = createEventStream(res);

    let interval;

    eventStream.on('close', () => {
        clearInterval(interval);
    })

    let i = 0;
    interval = setInterval(() => {
        eventStream.write("Hello world");
        
        i++
        if(i > 100) {
            // automatically close the event stream after 100 messages
            eventStream.end();
        }
    }, 1000);
});
```
