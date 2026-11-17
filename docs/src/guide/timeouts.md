# Timeouts and Cancellation

Timeouts bound how long a request or a single handler may take. When one fires, the request fails with `408 Request Timeout` and `event.signal` aborts, so work that accepts an `AbortSignal` stops as well.

```typescript
import { App, defineCoreHandler } from 'routup';

const app = new App({
    options: {
        timeout: 10_000,
        handlerTimeout: 2_000,
    },
});

app.get('/search', defineCoreHandler({
    timeout: 1_000,
    fn: async (event) => {
        const res = await fetch('https://api.example.com/search', { signal: event.signal });

        return res.json();
    },
}));
```

## Options

| Option | Set on | Default | Meaning |
|---|---|---|---|
| `timeout` | `new App({ options })` | none | Milliseconds for the whole request, until a handler returns its response |
| `handlerTimeout` | `new App({ options })` | none | Milliseconds for each handler's `fn` |
| `handlerTimeoutOverridable` | `new App({ options })` | `false` | Whether a handler's own `timeout` may be longer than `handlerTimeout` |
| `timeout` | handler options | none | Milliseconds for this handler's `fn`; narrows `handlerTimeout`, or replaces it when `handlerTimeoutOverridable` is `true` |

- An App `timeout` or `handlerTimeout` that is not a positive finite number is ignored.
- With `handlerTimeoutOverridable: false`, a handler gets the shorter of its `timeout` and `handlerTimeout`. With `true`, its `timeout` applies even when longer. A handler `timeout` without an App `handlerTimeout` applies as set.
- In the example, `/search` gets 1 second and every other handler 2 seconds; the whole request gets 10 seconds.

## What Happens on Timeout

Both timeouts end in an `AppError` with status 408 and the message `Request Timeout`. When no error handler answers it, the request gets the [fallback response](/guide/error-handling#fallback-response) with that status.

- An App `timeout` answers with the fallback at once, and no error handler can answer it. Handlers still running continue; when one fails on the aborted `event.signal`, the error handlers after it run, and their result is discarded.
- A handler timeout is a failure of that handler, like a throw: the error handlers registered after it can answer it.
- A timeout does not stop running code. It aborts `event.signal`; code that ignores the signal runs on, and its result is discarded.
- The App `timeout` ends when a handler returns its `Response`. A streamed body keeps streaming after that.
- A handler's timer covers `fn`. Its `onBefore` and `onAfter` run outside it.
- A middleware's timer also covers the handlers that run inside its `event.next()`.

## `event.signal`

`event.signal` is an `AbortSignal` that aborts when:

- the App `timeout` fires,
- the handler's own timeout fires (each handler with a timeout gets its own signal),
- the request's signal aborts, for example when the client disconnects.

Pass it to `fetch()`, database drivers or any API that takes a `signal` to cancel their work with the request. Without any timeout configured, `event.signal` is the request's signal.

## Returning `undefined`

A handler that returns `undefined`, or a promise of `undefined`, without having called `event.next()` is not finished. Routup waits until the handler calls `event.next()`, for example from a callback, or until `event.signal` aborts.

- Returning `undefined` after calling `event.next()` returns the downstream result; `event.next()` and `return event.next()` are equivalent.
- `event.next()` called later continues the pipeline, and its result becomes the handler's response.
- An abort, from a timeout or from the request's signal, ends the wait with a 408.
- With no timeout configured and no later `event.next()` call, the request never answers.

Routup does not read `undefined` as "not handled", so a forgotten `return` shows up as a hanging request instead of a wrong 404. Return `null` for an empty response.

The options are in the [`AppOptions` reference](/api/app#appoptions).
