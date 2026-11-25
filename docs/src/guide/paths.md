# Paths

Paths define the URL patterns that handlers and routers respond to. Routup uses [path-to-regexp](https://github.com/pillarjs/path-to-regexp) (v9) for pattern matching.

## Basic Paths

```typescript
app.get('/users', defineCoreHandler((event) => {
    return 'user list';
}));
```

Static segments match case-sensitively on every router: `/Users` does not match a route registered as `/users`.

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

When a segment contains several parameters and the input is ambiguous, the last one is greedy:

```typescript
// GET /foo.json.html → { file: 'foo', ext: 'json.html' }
app.get('/:file.:ext', defineCoreHandler((event) => event.params));
```

## Wildcards

Match any path suffix with a named wildcard:

```typescript
app.get('/files/*path', defineCoreHandler((event) => {
    return { path: event.params.path };
}));
```

A named wildcard needs at least one segment, and it keeps a trailing slash:

| Request | `event.params.path` |
|---|---|
| `/files`, `/files/` | no match (404) |
| `/files/a` | `a` |
| `/files/a/b/` | `a/b/` |

To also match the bare prefix, make the wildcard optional with `/files{/*path}`. It matches zero or more segments: `/files` and `/files/` run the handler without a `path` param. This applies on every router.

A path can also start with the group: `{/*path}` matches every path, `/` included, and inside an App mounted at `/x` it matches `/x` and everything below it.

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
