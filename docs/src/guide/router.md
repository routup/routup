# Router

A router is a wrapper that stacks [handlers](./handlers.md) and executes them on demand.
It is the central node of the ecosystem.

Routers can be nested arbitrarily deep and offers different ways
how a handler or another router can be bound to itself.
But more about this in the [mounting](#mounting) section.

```typescript
import { createServer } from 'node:http';
import {
    coreHandler,
    createNodeDispatcher,
    Router
} from 'routup';

const router = new Router();

router.get('/', coreHandler(() => 'Hello, World!'));

const server = createServer(createNodeDispatcher(router));
server.listen(3000)
```

It is possible to process requests not only from Nodejs, but also from other sources.
These requests can be transferred to the system with the help of so-called [dispatchers](./dispatchers.md).

## Mounting
A router can only be connected to another router using the **use** method.

### Global

Don't mount a router one on a specific path.

```typescript
import { Router } from 'routup';

const router = new Router();

const child = new Router();
router.use(child);
```

### Path

A path can either be declared as [string](./paths.md#string) or as [regular expression](./paths.md#regular-expressions)
In the following the router is mounted on the path `/child`.

```typescript
import { Router } from 'routup';

const router = new Router();

const child = new Router();
router.use('/child', child);
```

```typescript
import { Router } from 'routup';

const router = new Router({
    path: '/child'
});

const child = new Router();
router.use(child);
```
