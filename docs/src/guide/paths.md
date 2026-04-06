# Paths

Paths define the URL patterns that handlers and routers respond to. Routup uses [path-to-regexp](https://github.com/pillarjs/path-to-regexp) (v8) for pattern matching.

## Basic Paths

```typescript
router.get('/users', coreHandler((event) => {
    return 'user list';
}));
```

## Parameters

Named parameters capture values from the URL:

```typescript
router.get('/users/:id', coreHandler((event) => {
    return { id: event.params.id };
}));

router.get('/users/:id/roles/:roleId', coreHandler((event) => {
    return {
        id: event.params.id,
        roleId: event.params.roleId
    };
}));
```

## Wildcards

Match any path suffix with a named wildcard:

```typescript
router.get('/files/{*path}', coreHandler((event) => {
    return { path: event.params.path };
}));
```

## Optional Parameters

Wrap a segment in braces to make it optional:

```typescript
router.get('/users{/:id}', coreHandler((event) => {
    if (event.params.id) {
        return { id: event.params.id };
    }
    return { users: [] };
}));
```
