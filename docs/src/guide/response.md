# Response

The outgoing response is represented as an object, which is injected into a handler function.

There, it can either be interacted with directly or so-called [helpers](../api/request-helpers.md) can be used,
which provide abstractions for the interaction and transformation.

## Send

A handler can send a response either [explicitly](#explicit) or [implicitly](#implicit).
In both cases, the request is terminated and no further handler is called.

### Explicit

In the explicit variant, the response is sent with the help of a response [helper](../api/response-helpers.md)
(send, sendStream, sendFile, ...).

```typescript
import { coreHandler, send } from 'routup';

const handler = coreHandler((req, res) => {
    send(res, 'Hello World!');
});
```

```typescript
import fs from 'node:fs';
import { coreHandler, sendStream } from 'routup';

const handler = coreHandler((req, res) => {
    const readable = fs.createReadStream('...');
    sendStream(res, stream);
});
```

### Implicit

In the implicit variant, the value is simply returned and routup tries to find out for itself how to handle the value.

```typescript
import { coreHandler } from 'routup';

const handler = coreHandler(() => 'Hello, World!');
```

```typescript
import { coreHandler } from 'routup';

const handler = coreHandler(() => fs.createReadStream('...'));
```


