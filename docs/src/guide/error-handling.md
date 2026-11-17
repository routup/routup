# Error Handling

A handler reports a failure by throwing. Routup turns the thrown value into an `AppError`, skips the core handlers that follow and passes the error to the error handlers registered after the failing handler. When none of them answers, the App sends a fallback response.

```typescript
import {
    App,
    AppError,
    defineCoreHandler,
    defineErrorHandler,
} from 'routup';

const app = new App();

app.get('/users/:id', defineCoreHandler((event) => {
    throw new AppError({ status: 404, message: `User ${event.params.id} not found` });
}));

app.use(defineErrorHandler((error, event) => {
    event.response.status = error.status;

    return { error: error.message };
}));
```

## Throwing Errors

`AppError` takes a message string or an object with `status` and `message`. Without a `message`, the message is the reason phrase of the status: `new AppError({ status: 404 })` has the message `Not Found`.

Any other thrown value is converted with `createError()`, which is exported for use in your own code as well:

| Thrown value | Resulting `AppError` |
|---|---|
| `AppError` | the same object |
| string | status 500, the string as message |
| `HTTPError` from `@ebec/http` | its status and message |
| `Error` | status 500, its message, the original as `cause` |
| any other object | its `status` and `message`; a missing `status` becomes 500 and a missing `message` the status's reason phrase; its own `cause`, or the object itself as `cause` |
| any other value | status 500, message `Internal Server Error` |

The message of a thrown `Error` reaches the client through the [fallback response](#fallback-response). An error handler that returns its own body decides what the client sees instead.

## Error Handlers

`defineErrorHandler((error, event) => ...)` defines a handler that receives the pending error. It is registered like any other handler, with `app.use()` or a method and path.

- `error` is always an `AppError`.
- An error handler runs only while an error is pending, and core handlers are skipped while one is.
- It handles errors of the handlers registered before it. Register it after the routes it covers; an error handler registered before the failing route does not run.
- Mounted on a path (`app.use('/api', handler)`), it handles errors of requests under that path only.
- Its return value becomes the response like a core handler's, with the status of `event.response.status`, which is 200 unless set. Copy `error.status` there to keep the error's status.
- Throwing from an error handler replaces the pending error. The next error handler, or the fallback, receives the new one.
- Calling `event.next()` passes the same error on to the next error handler.
- A path that matches no handler raises no error, so error handlers do not run for it. The App answers with the 404 fallback.

The [JSON Errors example](/examples/json-errors) shapes every error of an app into one JSON body.

## Forwarding with `event.next(error)`

A handler can pass an error on without throwing:

```typescript
app.use(defineCoreHandler((event) => {
    if (!event.headers.get('authorization')) {
        return event.next(new AppError({ status: 401, message: 'Unauthorized' }));
    }

    return event.next();
}));
```

- The argument is converted with `createError()` and becomes the pending error.
- The promise of `event.next(error)` resolves with the response of the error handler that answers, or `undefined` when none does.
- When a handler after a middleware throws, `await event.next()` in the middleware does not reject either. It resolves with the error handler's response, or `undefined`, and the fallback applies.

## Fallback Response

When no handler produces a response, `app.fetch()` builds one:

| Situation | Status | Message |
|---|---|---|
| an error is pending | the error's `status`, or 500 | the error's `message` |
| no error is pending | 404 | `Not Found` |

- The body is `{"status":<status>,"message":"<message>"}` with `content-type: application/json` when the request accepts JSON, and the message as `text/plain` otherwise.
- A request accepts JSON when it has no `Accept` header, or when its `Accept` header lists `*/*`, `application/*`, `application/json` or a `+json` type with a quality above 0.
- Headers set on `event.response` before the failure are kept.

## Checking for an `AppError`

`isError(value)` is `true` for an `AppError`, including one returned by `createError()`, and `false` for a plain `Error`. It checks a marker instead of `instanceof`, so it also recognises an `AppError` created by another copy of routup.

In this fragment, `loadUser()` stands for any call that may throw an `AppError`:

```typescript
defineCoreHandler(async (event) => {
    try {
        return await loadUser(event.params.id);
    } catch (e) {
        if (isError(e) && e.status === 404) {
            return null;
        }

        throw e;
    }
});
```

The [Errors reference](/api/errors) lists the signatures of `AppError`, `createError()` and `isError()`.
