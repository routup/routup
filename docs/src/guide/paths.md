# Paths

Paths define the URL patterns that handlers and routers respond to. Routup uses [path-to-regexp](https://github.com/pillarjs/path-to-regexp) for pattern matching.

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

Match any path suffix with a wildcard:

```typescript
router.get('/files/*', coreHandler((event) => {
    return { path: event.params[0] };
}));
```

## Regular Expressions

Use regular expressions for advanced matching:

```typescript
router.get(/^\/users\/(\d+)$/, coreHandler((event) => {
    return { id: event.params[0] };
}));
```

## Optional Parameters

Append `?` to make a parameter optional:

```typescript
router.get('/users/:id?', coreHandler((event) => {
    if (event.params.id) {
        return { id: event.params.id };
    }
    return { users: [] };
}));
```
