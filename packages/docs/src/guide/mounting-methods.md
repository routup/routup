# Mounting Methods

A handler can either be executed on [any](#any) HTTP method or only on a [specific](#specific) one. 

## Any 

Respond to a **any** (get, post, delete, ...) request on the `/` route.

```typescript
router.use('/', (req, res) => {
    send(res, 'Received a GET request.');
})
```


## Specific

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
