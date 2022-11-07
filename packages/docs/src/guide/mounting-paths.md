# Mounting Paths

Mounting paths define endpoints (URIs) for which a request can be handled.
Besides, defining [string](#string) paths, [regular expressions](#regular-expressions) can be used as well.

Route handlers should in most cases, use a [helper](./helpers.md) (e.g. [send](./api-reference-response-helpers.md#send))
to send a response and terminate the request on completion.

This does not apply, if the request should be handled by another handler in the callback chain.
Therefore, invoke another handler with the **next** function, which is passed as third argument to a route handler.

The following examples should illustrate how to define simple routes:

## String

**`Simple`**

Respond to a **GET** request on the `/foo` route.

```typescript
router.get('/foo', (req, res) => {
    send(res, '/foo');
})
```

**`Parameters`**

Path parameters are named URL segments that are used to capture the corresponding value at the position in the URL.
The captured values can be acquired using the helper `useRequestParams`. The returned value is an object,
with the name of the path parameter specified in the path as their respective keys.

```typescript
router.get('/users/:id/roles/:roleId', (req, res) => {
    const params = useRequestParams(req);
    console.log(params);
    // { id: 'xxx', roleId: 'xxx' }

    const param = useRequestParam(req, 'id');
    console.log(param);
    // xxx
    
    send(res, params);
})
```

## Regular Expressions

Respond to a **get** request on all paths containing a string with `a` in it.

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
