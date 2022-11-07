# Parser

Besides using the `createRequestParser` method, it is also possible to register a specific parser
as middleware.

## Json

To parse `application/json` input data, mount the json parser to the router instance.

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestJsonParser } from '@routup/body';

const router = new Router();
router.use(createRequestJsonParser());

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```

## UrlEncoded

To parse `application/x-www-form-urlencoded` input data, mount the url-encoded parser to the router instance.

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestUrlEncodedParser } from '@routup/body';

const router = new Router();
router.use(createRequestUrlEncodedParser({ extended: false }));

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```

## Raw

To parse `any` input data as Buffer, mount the raw parser to the router instance.

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestRawParser } from '@routup/body';

const router = new Router();
router.use(createRequestRawParser());

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```

## Text

To parse `any` input data as string, mount the text parser to the router instance.

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestTextParser } from '@routup/body';

const router = new Router();
router.use(createRequestTextParser({ type: 'text/html' }));

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```
