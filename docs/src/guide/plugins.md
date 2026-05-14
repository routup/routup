# Plugins

Routup is minimalistic by design. Plugins extend the framework with additional functionality that is not part of the core.

A plugin is an object with a `name` and an `install` method that receives the app instance.

## Mounting

Mount a plugin globally:

```typescript
app.use(myPlugin({ /* options */ }));
```

Mount a plugin on a specific path:

```typescript
app.use('/api', myPlugin({ /* options */ }));
```

## Writing a Plugin

For the full plugin authoring contract — interface, mounting semantics, and conventions — see the [Plugin Authoring](./plugin-authoring/) guide.

## Ecosystem

Official plugins are available at [GitHub](https://github.com/routup/plugins).

| Name | Description |
|------|-------------|
| [assets](https://github.com/routup/plugins/tree/master/packages/assets/) | Serve static files from a directory |
| [basic](https://github.com/routup/plugins/tree/master/packages/basic/) | Bundle of body, cookie, and query plugins |
| [body](https://github.com/routup/plugins/tree/master/packages/body/) | Read and parse the request body |
| [cookie](https://github.com/routup/plugins/tree/master/packages/cookie/) | Read/write cookies |
| [decorators](https://github.com/routup/plugins/tree/master/packages/decorators/) | Class, method, and parameter decorators |
| [prometheus](https://github.com/routup/plugins/tree/master/packages/prometheus/) | Collect and serve Prometheus metrics |
| [query](https://github.com/routup/plugins/tree/master/packages/query/) | Parse URL query strings |
| [rate-limit](https://github.com/routup/plugins/tree/master/packages/rate-limit/) | Rate limit incoming requests |
| [rate-limit-redis](https://github.com/routup/plugins/tree/master/packages/rate-limit-redis/) | Redis adapter for rate-limit |
| [swagger](https://github.com/routup/plugins/tree/master/packages/swagger) | Serve Swagger/OpenAPI docs |
