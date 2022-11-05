# Routing Paths

Route paths define endpoints for which a request can finally be handled.
Besides, defining **simple** paths, **patterns** and **regular expressions** can be used as well.

Route handlers should in most cases, use a [helper]() (e.g. `send()`) to send a final response and terminate the request.
This does not apply, if the request should be handled by another handler in the callback chain.
Therefore, invoke another handler with the **next** function, which is passed as third argument to a route handler.

The following examples should illustrate how to define simple routes:

## Simple

**`GET`**

Respond to a **get** request on the `/` route.

```typescript
router.get('/', (req, res) => {
    send(res, 'Received a GET request.');
})
```

**`POST`**

Respond to a **post** request on the `/foo` route.

```typescript
router.post('/foo', (req, res) => {
    send(res, 'Received a POST request.');
})
```

**`PUT`**

Respond to a **put** request on the `/bar` path.

```typescript
router.put('/bar', (req, res) => {
    send(res, 'Received a PUT request.');
})
```

**`PATCH`**

Respond to a **patch** request on the `baz` path.

```typescript
router.patch('/baz', (req, res) => {
    send(res, 'Received a PATCH request.');
})
```

**`DELETE`**

Respond to a **delete** request on the `buz` path.

```typescript
router.delete('/buz', (req, res) => {
    send(res, 'Received a DELETE request.');
})
```

## Patterns

Respond to a **get** request on the following paths: **acd** and **abcd**

```typescript
router.get('/ab?cd', (req, res) => {
    send(res, 'ab?cd');
})
```

Respond to a **get** request on the following paths: **abcd**, **abbcd**, ...

```typescript
router.get('/ab+cd', (req, res) => {
    send(res, 'ab+cd');
})
```

## Regular Expressions

Respond to a **get** request on all paths containing a string with **a** in it.

```typescript
router.get(/a/, (req, res) => {
    send(res, '/a/');
})
```

Respond to a **get** request where the path matches `butterfly` and `dragonfly`, but **not** `butterflyman`, `dragonflyman`, and so on.

```typescript
router.get(/.*fly$/, (req, res) => {
    send(res, '/.*fly$/');
})
```
