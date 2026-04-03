# Hooks

Hooks are a way to listen to specific events in the request/response lifecycle and
to manipulate the request or response at certain steps during the dispatch process, or to terminate the request early.

The following router level hooks are available:
- [dispatchStart](#dispatchstart)
- [childMatch](#childmatch)
- [childDispatchBefore](#childdispatchbefore)
- [childDispatchAfter](#childdispatchafter)
- [dispatchEnd](#dispatchend)
- [error](#error)

The following handler level hooks are available:

- [onBefore](#onbefore)
- [onAfter](#onafter)
- [onError](#onerror)

It is important to note that if a hook returns a value that does not resolve to `undefined`,
this value is sent as a response and the request is terminated.

## Context

Hook listeners always receive an argument of type [DispatchEvent](). If an error occurred during the dispatch process,
the argument is of type [DispatchErrorEvent]().

````typescript
router.on('dispatchStart', (event) => {
    event.request // Request object
    event.response // Response object
    event.params // Params collected during execution
    event.path // Request path
    event.method // GET, POST, ...
    event.error // The error which occurred during the dispatch process. 
    event.dispatched // Indicate if the request has already been dispatched/send.
    event.next() // Call the next handler/router
});
````

## Async/Sync

Hook Listeners can be defined both asynchronously and synchronously.
A synchronous hook listener can be defined as follows. 
In the example a callback call is also involved to illustrate how to proceed with the lifecycle in this case.

**Sync**

```typescript
router.on('dispatchStart', (event) => {
    cbMethod((err) => {
        if(err) {
            event.next(err);
            return;
        }
        
        event.next();
    })
})
```

**Async**

```typescript
router.on('dispatchStart', async (event) => {
    await asyncMethod();
})
```

## Router
### dispatchStart

This hook is triggered when the dispatch process starts.
It signals the start of the router processing a request.

```typescript
router.on('dispatchStart', async (event) => {
    // do something
})
```

### childMatch
This hook is called when a matching child router or handler is found based on certain criteria such as **method** and **path**.

```typescript
router.on('childMatch', async (event) => {
    // do something
})
```

### childDispatchBefore
This hook is called **before** the dispatch process of the child router or handler is executed.

```typescript
router.on('childDispatchBefore', async (event) => {
    // do something
})
```

### childDispatchAfter
This hook is called **after** the dispatch process of the child router or handler is executed.

::: warning **Note**

The hook is a bit special, because it is called even if the request is already dispatched.
Therefore, the **dispatched** property must be checked if a response is to be given.
:::

```typescript
router.on('childDispatchAfter', async (event) => {
    if(event.dispatched) {
        // response can no longer be modified.
    } else {
        // response can be modified.
    }
    
    // do something
})
```

### dispatchEnd
This hook is called after the dispatch process of the current router instance is terminated.

::: warning **Note**

The hook is a bit special, because it is called even if the request is already dispatched.
Therefore, the **dispatched** property must be checked if a response is to be given.
:::

```typescript
router.on('dispatchEnd', async (event) => {
    if(event.dispatched) {
        // response can no longer be modified.
    } else {
        // response can be modified.
    }
    
    // do something
})
```

### error
This hook is called when an error occurs during another hook, the dispatch process of a handler or child router. 
It can be used in different ways. Either the error is handled as in the following example and a response is sent.

```typescript
router.on('error', ({ error, response }) => {
    response.statusCode = error.statusCode;
    
    return 'An error occured: ' + error.message;
})
```
The other option is to modify the error and pass it either with the **next()** method or by throwing the error.

**`throw`**
```typescript
router.on('error', ({ error }) => {
    error.statusCode = 500;
    
    throw error;
});
```

**`next`**
```typescript
router.on('error', ({ error, next }) => {
    error.statusCode = 500;
    
    next(error);
});
```

## Handler

Handler hooks are somewhat special, as they must be defined differently than router level hooks.
However, the [context](#context) or the handler argument is the same as for the router hooks.

### onBefore

```typescript
router.use(coreHandler({
    fn: () => 'Hello, World!',
    onBefore({ next }) {
        // do something
        next();
    }
}));
```

### onAfter

```typescript
router.use(coreHandler({
    fn: () => 'Hello, World!',
    onAfter({ next }) {
        // do something
        next();
    }
}));
```

### onError

```typescript
router.use(coreHandler({
    fn: () => 'Hello, World!',
    onError({ error, next }) {
        // do something
        next();
    }
}));
```
