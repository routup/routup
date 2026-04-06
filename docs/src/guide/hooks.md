# Hooks

Hooks let you listen to lifecycle events during request processing. They can inspect, modify, or short-circuit requests and responses.

## Available Hooks

### Router-level Hooks

| Hook | Fires when |
|------|-----------|
| `request` | A request enters the router |
| `response` | The router has produced a response |
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

Use `router.on()` to register hook listeners. It returns an unsubscribe function:

```typescript
const unsubscribe = router.on('request', (event) => {
    console.log(`${event.method} ${event.path}`);
});

// Later, to remove the listener:
unsubscribe();
```

## Hook Context

Hook listeners receive the event object with access to:

```typescript
router.on('request', (event) => {
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
router.on('request', (event) => {
    // synchronous logic
});

// Async
router.on('request', async (event) => {
    await someAsyncOperation();
});
```

## Router Hooks

### request

Triggered when a request enters the router:

```typescript
router.on('request', (event) => {
    console.log('incoming request:', event.path);
});
```

### response

Triggered when the router has produced a response:

```typescript
router.on('response', (event) => {
    console.log('response sent for:', event.path);
});
```

### error

Triggered when an error occurs during dispatch:

```typescript
router.on('error', (event) => {
    console.error('dispatch error:', event.error);
});
```

### childMatch

Triggered when a matching child handler or router is found:

```typescript
router.on('childMatch', (event) => {
    // inspect the matched child
});
```

### childDispatchBefore

Triggered before dispatching to the matched child:

```typescript
router.on('childDispatchBefore', (event) => {
    // run logic before child handles request
});
```

### childDispatchAfter

Triggered after the matched child completes:

```typescript
router.on('childDispatchAfter', (event) => {
    // run logic after child handles request
});
```

## Handler Hooks

Handler-level hooks are defined in the verbose handler declaration:

### onBefore

```typescript
router.use(coreHandler({
    fn: (event) => 'Hello, World!',
    onBefore(event) {
        // runs before the handler
    }
}));
```

### onAfter

```typescript
router.use(coreHandler({
    fn: (event) => 'Hello, World!',
    onAfter(event) {
        // runs after the handler
    }
}));
```

### onError

```typescript
router.use(coreHandler({
    fn: (event) => 'Hello, World!',
    onError(event) {
        // handle handler-specific errors
    }
}));
```
