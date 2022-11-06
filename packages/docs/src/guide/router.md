# Router

A router is an object containing other routers & (error-) handlers, which are composed and executed
in a stack-like manner upon request.

## Mounting 

::: warning **Note**

Handlers can also be restricted to a specific http method.
[Read more](./routing.md)

:::

To mount a router- or handler-instance to the current router, use the `use()` class method.

```typescript
router.use((req, res, ...) => {
    // ....
})
```

It is also possible, to pass **two** arguments. In that case the
first argument must be a path (string or Regexp) and the second argument the actual router- or handler-instance.

```typescript
router.use('/', (req, res, ...) => {
    // ...
})
```

## Listener

To create a http server and listen for incoming requests, there are two possibilities to do so:

**`#1`**

```typescript
import { Router, send } from 'routup';

const router = new Router();

router.get('/', (req, res) => {
    send(res, 'Hello World');
});

router.listen(3000);
```

**`#2`**

```typescript
import { createServer } from 'http';
import { Router, send } from 'routup';

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
