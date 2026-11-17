# Lifecycle Callbacks

`onBefore`, `onAfter` and `onError` run code around one handler without changing its result, for logging, metrics or tracing of a single route. They are options of the verbose form of `defineCoreHandler()` and `defineErrorHandler()`.

The fragment below logs how long one route takes; `buildReport()` stands for the route's work:

```typescript
app.get('/report', defineCoreHandler({
    onBefore: (event) => {
        event.store.start = performance.now();
    },
    onAfter: (event, response) => {
        const ms = performance.now() - (event.store.start as number);
        console.log(`${event.path} ${response?.status} ${ms.toFixed(1)}ms`);
    },
    fn: () => buildReport(),
}));
```

## Callbacks

| Option | Signature | Runs |
|---|---|---|
| `onBefore` | `(event) => unknown` | before `fn`; a returned promise is awaited before `fn` is called |
| `onAfter` | `(event, response) => unknown` | after the return value of `fn` became a `Response`; `response` is `undefined` when the handler produced none |
| `onError` | `(error, event) => unknown` | when `fn`, `onBefore` or `onAfter` throws, including the 408 of a [per-handler timeout](/guide/timeouts) |

- All three receive the event that `fn` receives, so `event.store` carries a value from `onBefore` to `onAfter`.
- Their return values are ignored. To answer a request early, use [middleware](/guide/middleware-patterns).
- `error` is an `AppError` (see [Error Handling](/guide/error-handling)).

## Order

A handler runs `onBefore`, then `fn`, then `onAfter`. Around `event.next()`:

- The handlers after a middleware run inside its `fn`. Their callbacks fire before the middleware's `onAfter`, and that `onAfter` receives the downstream response.
- For a middleware and a route that both set all callbacks, the order is: middleware `onBefore`, middleware `fn`, route `onBefore`, route `fn`, route `onAfter`, middleware `onAfter`.

On failure:

- When `onBefore` throws, `fn` does not run and `onError` fires.
- When `onAfter` throws, the response `fn` produced is dropped and `onError` fires.
- `onError` does not recover. Returning normally lets the error continue to the error handlers; throwing replaces it with the new error.
- `onError` fires for this handler's own failures. An error thrown by a handler that runs inside its `event.next()` does not fire it.
- On an error handler, the callbacks fire only when that handler runs, which needs a pending error.

## No App-Level Hooks

`App` has no hook registry and no `on()` method. Code that should wrap every handler, or every handler under a path, is a middleware: see [Middleware Patterns](/guide/middleware-patterns).
