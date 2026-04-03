# Paths

Paths define endpoints (URIs) on which a handler or router is mounted.
The following example should illustrate how paths can be defined:

Respond to a **GET** request on the `/foo` route.

```typescript
router.get('/foo', coreHandler(() => 'foo'));
```

## Parameters

Path parameters are named URL segments that are used to capture the corresponding value at the position in the URL.
The captured values can be acquired using the helper [useRequestParam](../api/request-helpers.md#userequestparam) and
[useRequestParams](../api/request-helpers.md#userequestparams).

```typescript
router.get('/users/:id/roles/:roleId', coreHandler((req, res) => {
    const params = useRequestParams(req);
    console.log(params);
    // { id: 'xxx', roleId: 'xxx' }

    const param = useRequestParam(req, 'id');
    console.log(param);
    // xxx
    
    return params;
}));
```
