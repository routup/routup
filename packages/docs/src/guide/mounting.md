# Mounting

The following structure, enables a handler or router to be mounted on a specific path (string or Regexp).

```
router.METHOD(PATH, INSTANCE)
```

It is also possible to mount the handler or router without specifying a path:

```
router.METHOD(INSTANCE)
```

Where:
- **router** represents a router instance
- **METHOD** can be an HTTP method (get, post, ...) in lowercase, to restrict the handler to a specific HTTP method.
  Otherwise, the `use` method can be used to respond to any HTTP method. [Read more](./mounting-methods.md)
- **PATH** defines the relative endpoint of the handler [Read more](#path)
- **INSTANCE** is an (error-) handler or router instance

## Global

**`Handler`**

Respond to any request

```typescript
router.use((req, res) => {
    send(res, 'Hello world!');
})
```

**`Router`**

Mount a router instance to another one

```typescript
const child = new Router();
router.use(child);
```

## Local

**`Handler`**

Mount a handler on the `/` path

```typescript
router.use('/', (req, res) => {
    send(res, 'Hello world!');
})
```

**`Router`**

Mount a router instance to another one on the `/` path

```typescript
const child = new Router();
router.use('/', child);
```
