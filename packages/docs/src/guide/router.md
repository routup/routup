# Router

A router is an object containing handler instances, which are composed and executed
in a stack-like manner upon request.

There are **three** kind of handlers, which can be mounted on a routing instance.
- Route
- Middleware
- Router

## Mounting 

::: warning **Note**

Route handlers can also be mounted for a specific http method.
[Read more](./routing.md)

:::

To mount a handler to the current router instance, use the `use()` class method.

```typescript
router.use((req, res, ...) => {
    // ....
})
```

The **use** method also accepts two argument. In that case the
first argument must be a specific [routing](./routing.md) path and the second argument the actual handler.

```typescript
router.use('/', (req, res, ...) => {
    // ...
})
```

## Listener

To create a http server and listen for incoming requests, there are two variants to do so:

**`Variant #1`**

```typescript
import { Router, send } from 'sapir';

const router = new Router();

router.get('/', (req, res) => {
    send(res, 'Hello World');
});

router.listen(3000);
```

**`Variant #2`**

```typescript
import { createServer } from 'http';
import { Router, send } from 'sapir';

const router = new Router();

createServer(router.createListener()).listen(3000);
```

## Nesting

Router instances can be combined, by mounting a router instance
to the other one.

**`user-router.js`**
```typescript
const router = new Router();

router.get('/', () => {
    // get a user collection
    
    send(res);
});

router.post('/', () => {
    // create a user

    send(res);
})

router.get('/:id', () => {
    // get a user by id...
    
    send(res);
});

export default router;
```

**`index.js`**
```typescript
import userRouter from './user-router';

const router = new Router();

// ...

router.use('/users', userRouter);

// ...

```
