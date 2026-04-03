# Dispatcher

There are different dispatchers how requests can be transmitted in different ways.

## Node

The node dispatcher is about handling requests from a node http(s) server.
For this purpose either the predefined function dispatchNodeRequest can be used, which can be used as follows:

```typescript
import { createServer } from 'node:http';
import {
    coreHandler,
    dispatchNodeRequest,
    Router
} from 'routup';

const router = new Router();

router.get('/', coreHandler(() => 'Hello, World!'));

const server = createServer((req, res) => {
    void dispatchNodeRequest(router, req, res);
});
server.listen(3000);
```

The other option is to create a dispatch function for a specific router.

```typescript
import {createServer} from 'node:http';
import {
    createNodeDispatcher,
    coreHandler,
    Router
} from 'routup';

const router = new Router();

router.get('/', coreHandler(() => 'Hello, World!'));

const server = createServer(createNodeDispatcher(router));
server.listen(3000)
```

## Raw

In the case of dispatching raw requests, a request can be created manually, 
and the response can then be traded as desired. Thus, this approach provides complete freedom.
This request can include attributes like **path**, **headers**, **body** & **method**.

```typescript
import fs from 'node:fs';
import {
    createRawDispatcher,
    coreHandler,
    Router
} from 'routup';

const router = new Router();

router.post('/', coreHandler(() => 'Hello, world!'));

const dispatch = createRawDispatcher(router);

const stream = fs.createReadStream('**/*.json');
const response = await dispatch({
    method: 'POST',
    path: '/foo',
    headers: {
        'content-type': 'application/json; charset=utf-8',
    },
    body: stream,
});

console.log(response);
// { status: xxx, statusMessage: "xxx", body: xxx, headers: xxx }
```

In addition to the **createRawDispatcher** function, there is also a **dispatchRawRequest** function, 
as in the case of the node dispatcher, which accepts an arbitrary router instance as an additional first argument.

## Web

The web dispatcher, is used to process a request based on the web api.
This can be done as follows:

```typescript
import {
    createWebDispatcher,
    coreHandler,
    Router
} from 'routup';

const router = new Router();

router.get('/', coreHandler(() => 'Hello, World!'));

const dispatch = createWebDispatcher(router);
const request = new Request(
    new URL('/foo', 'http://localhost/'),
    {
        method: 'GET',
        path: '/',
    }
);
const response = await dispatch(request);
```
In addition to the **createWebDispatcher** function, there also exists a **dispatchWebRequest** function,
to dispatch the request to an arbitrary router.
