# Router

A router is an object containing other routers & (error-) handlers, which are composed and executed
in a stack-like manner upon request.

Besides that, a router is the entrypoint for determining how an application should respond to an incoming client request on a particular endpoint, 
which is identified by a URI (or path) and a HTTP method (GET, POST, ...).

Each endpoint aka path can have one or more handler functions, which are executed when the route (& method) is matched.

## Listener

A router can either create a http server and listen for incoming requests on a specific port.

```typescript
import { Router, send } from 'routup';

const router = new Router();

router.get('/', (req, res) => {
    send(res, 'Hello World');
});

router.listen(3000);
```

Alternative a router instance can create a listener, which can be injected in an existing http/https server.

```typescript
import { createServer } from 'http';
import { Router, send } from 'routup';

const router = new Router();

createServer(router.createListener()).listen(3000);
```
