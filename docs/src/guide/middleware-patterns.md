# Middleware patterns

Routup v6 has no `app.on(...)` / hook API. Middleware — built from `defineCoreHandler` (around `event.next()`) and `defineErrorHandler` — is the single way to wrap behavior around requests. The v5 use cases for lifecycle hooks all express cleanly as middleware:

| v5 hook | v6 equivalent |
|---|---|
| `app.on('start', fn)` | `app.use(defineCoreHandler((event) => { fn(event); return event.next(); }))` registered first |
| `app.on('end', fn)` | `defineCoreHandler(async (event) => { const r = await event.next(); fn(event, r); return r; })` registered first |
| `app.on('error', fn)` | `defineErrorHandler((err, event) => { fn(err, event); throw err; })` (or shape a response and return it) |
| Handler `onBefore` / `onAfter` / `onError` | wrap the handler in a middleware that calls `event.next()` |

The benefit: **one composition primitive** that can be path-scoped (`app.use('/api', mw)`), method-scoped (via a verb shortcut), and composed in either direction.

The cost worth knowing: middleware is **in** the onion. A buggy listener can't deadlock the request when it's a hook; a middleware that forgets `return event.next()` can.

## Request logging (was `'start'` + `'end'`)

```typescript
app.use(defineCoreHandler(async (event) => {
    const start = Date.now();
    const response = await event.next();
    console.log(`${event.method} ${event.path} → ${response?.status ?? '???'} (${Date.now() - start}ms)`);
    return response;
}));
```

Register this as the first middleware so it brackets every downstream handler in the onion.

## Error observability (was `'error'`)

A side-effect-only error listener:

```typescript
app.use(defineErrorHandler((error, event) => {
    Sentry.captureException(error, { extras: { path: event.path } });
    throw error; // let downstream error handlers shape the response
}));
```

To both observe and recover, return a response instead of re-throwing:

```typescript
app.use(defineErrorHandler((error) => ({
    status: error.status ?? 500,
    message: error.message,
})));
```

Error handlers run only when `event.error` is set. They sit in the same match list as core handlers — order them at the position you want them to catch.

## Path-scoped instrumentation

Path-scoped middleware is the natural replacement for sub-app-scoped hooks. Mount on a prefix:

```typescript
app.use('/api', defineCoreHandler(async (event) => {
    metrics.increment('api.requests');
    const response = await event.next();
    metrics.timing('api.response_time', /* … */);
    return response;
}));
```

This runs for every `/api/*` request and no others — the equivalent of attaching `'start'`/`'end'` listeners to a sub-app in v5.

## Conditional short-circuit (was `'start'` returning a response)

A middleware that returns a value directly (instead of calling `event.next()`) short-circuits the chain — equivalent to a hook that set `event.dispatched = true`:

```typescript
app.use(defineCoreHandler((event) => {
    if (event.headers.get('x-maintenance') === 'on') {
        event.response.status = 503;
        return 'Service Unavailable';
    }
    return event.next();
}));
```

## Why no hooks?

The v5 hook API duplicated what middleware already does: run code at a lifecycle point, optionally short-circuit. Middleware adds path-scoping for free and integrates with the onion model — error/request/response semantics fall out of where you mount it instead of which event name you pick.

Removing hooks also lets the dispatcher collapse the `START` / `LOOKUP` / `CHILD_DISPATCH_BEFORE` / `CHILD_DISPATCH_AFTER` / `END` state machine into a straight match-loop. One composition primitive, fewer concepts, a tighter hot path.
