# Testing

An App is tested without a server: `app.fetch()` takes a Web `Request` and resolves with the `Response` a client would receive. Any test runner works, and routup ships no test helpers.

```typescript
const response = await app.fetch(new Request('http://localhost/users/1'));
```

- The request URL must be absolute. Routing reads its method and path, so any host works.
- Status, headers and body are read with the standard `Response` API: `response.status`, `response.headers.get()`, `await response.json()` or `await response.text()`.
- A request body, method and headers are set with the `Request` options: `new Request(url, { method: 'POST', headers, body })`.

## A Vitest Example

The file below defines a small app with a middleware, a route and an error handler, and tests each of them. It runs with `npx vitest`.

<<< @/../../test/unit/docs/examples/testing-guide.spec.ts

The middleware sets its header on `event.response`, so the header is also on the response the error handler builds.

## What a Plain `Request` Lacks

`app.fetch()` called directly skips the server adapter, so the request has none of the fields the adapter adds:

- `event.request.ip` is unset and `getRequestIP(event)` returns `undefined`. To test code that reads it, type the request as `AppRequest` and assign an address to `request.ip` before calling `app.fetch()`.
- Handlers wrapped with `fromNodeHandler()` or `fromNodeMiddleware()` depend on the Node.js adapter: see [Express Compatibility](/guide/express-compatibility#how-it-works) for how to test an app that uses them.

## Related

- [Error Handling](/guide/error-handling): the fallback response a test sees when no handler answers
- [Plugin Conventions](/guide/plugin-authoring/conventions#test-skeleton): testing a plugin the same way
- [App reference](/api/app): `app.fetch()` and the App's options
