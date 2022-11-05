# Routing Parameters

Route parameters are named URL segments that are used to capture the corresponding value at the position in the URL. 
The captured values can be acquired using the helper `useRequestParams`. The returned value is an object, 
with the name of the route parameter specified in the path as their respective keys.

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
