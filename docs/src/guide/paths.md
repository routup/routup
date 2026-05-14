# Paths

Paths define the URL patterns that handlers and routers respond to. App uses [path-to-regexp](https://github.com/pillarjs/path-to-regexp) (v8) for pattern matching.

## Basic Paths

```typescript
app.get('/users', defineCoreHandler((event) => {
    return 'user list';
}));
```

## Parameters

Named parameters capture values from the URL:

```typescript
app.get('/users/:id', defineCoreHandler((event) => {
    return { id: event.params.id };
}));

app.get('/users/:id/roles/:roleId', defineCoreHandler((event) => {
    return {
        id: event.params.id,
        roleId: event.params.roleId
    };
}));
```

## Wildcards

Match any path suffix with a named wildcard:

```typescript
app.get('/files/{*path}', defineCoreHandler((event) => {
    return { path: event.params.path };
}));
```

## Optional Parameters

Wrap a segment in braces to make it optional:

```typescript
app.get('/users{/:id}', defineCoreHandler((event) => {
    if (event.params.id) {
        return { id: event.params.id };
    }
    return { users: [] };
}));
```
