# Hooks

Hooks let you listen to lifecycle events during request processing. They can inspect, modify, or short-circuit requests and responses.

## Available Hooks

### App-level Hooks

| Hook | Fires when |
|------|-----------|
| `start` | A request enters the router (once per `App.dispatch`) |
| `end` | The router has produced a response (once per `App.dispatch`) |
| `error` | An error occurs during dispatch |
| `childMatch` | A matching child handler/router is found |
| `childDispatchBefore` | Before dispatching to a matched child |
| `childDispatchAfter` | After a matched child completes |

### Handler-level Hooks

| Hook | Fires when |
|------|-----------|
| `onBefore` | Before the handler executes |
| `onAfter` | After the handler executes |
| `onError` | When the handler throws an error |

## Registering Hooks

Use `app.on()` to register hook listeners. It returns an unsubscribe function:

```typescript
const unsubscribe = app.on('start', (event) => {
    console.log(`${event.method} ${event.path}`);
});

// Later, to remove the listener:
unsubscribe();
```

## Hook Context

Hook listeners receive the event object with access to:

```typescript
app.on('start', (event) => {
    event.request;      // ServerRequest
    event.method;       // HTTP method
    event.path;         // Request path
    event.params;       // Route params
    event.headers;      // Request headers
    event.response;     // Response accumulator
    event.store;        // Per-request state store
});
```

If a hook returns a non-undefined value, that value becomes the response and the request is terminated.

## Async and Sync

Hooks support both synchronous and asynchronous listeners:

```typescript
// Sync
app.on('start', (event) => {
    // synchronous logic
});

// Async
app.on('start', async (event) => {
    await someAsyncOperation();
});
```

## App Hooks

### start

Triggered when a request enters the app. Fires once per
`App.dispatch` call — middleware that re-enters the pipeline via
`event.next()` does not re-trigger it.

```typescript
app.on('start', (event) => {
    console.log('incoming request:', event.path);
});
```

### end

Triggered when the router has produced a response. Fires once per
`App.dispatch` call (symmetric with `start`).

```typescript
app.on('end', (event) => {
    console.log('response sent for:', event.path);
});
```

### error

Triggered when an error occurs during dispatch:

```typescript
app.on('error', (event) => {
    console.error('dispatch error:', event.error);
});
```

### childMatch

Triggered when a matching child handler or router is found:

```typescript
app.on('childMatch', (event) => {
    // inspect the matched child
});
```

### childDispatchBefore

Triggered before dispatching to the matched child:

```typescript
app.on('childDispatchBefore', (event) => {
    // run logic before child handles request
});
```

### childDispatchAfter

Triggered after the matched child completes:

```typescript
app.on('childDispatchAfter', (event) => {
    // run logic after child handles request
});
```

## Handler Hooks

Handler-level hooks are defined in the verbose handler declaration:

### onBefore

```typescript
app.use(defineCoreHandler({
    fn: (event) => 'Hello, World!',
    onBefore(event) {
        // runs before the handler
    }
}));
```

### onAfter

```typescript
app.use(defineCoreHandler({
    fn: (event) => 'Hello, World!',
    onAfter(event) {
        // runs after the handler
    }
}));
```

### onError

```typescript
app.use(defineCoreHandler({
    fn: (event) => 'Hello, World!',
    onError(event) {
        // handle handler-specific errors
    }
}));
```
