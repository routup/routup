# Handlers

Handlers are executed in a stack like manner.
One handler after the other is processed until a handler interrupts the chain.
Only handlers that meet criteria such as the path and method are called.
A handler can be [mounted](#mounting) to a router in different ways.

## Middleware
A handler that does not finalize the request is called **middleware**.
Such a handler calls the `next()` callback function or returns a value that resolves to `undefined` to execute the next handler in the chain.

::: warning **Note**

Express middleware libraries (like body-parser, multer, ...) should work in most cases
out of the box 🔥. [Read more](./express-compatibility.md).

:::

## Types
There are different types of handlers that are called depending on the conditions.

### Core
A **core** handler is the default handler that either interrupts the chain by sending a response 
or passes the request to the next handler in the chain.

**`explicit`**

The coreHandler function should be used to define a handler function in the classical sense.

```typescript
import { coreHandler } from 'routup';

const handler = coreHandler((req, res, next) => {
    // ...
});
```

**`implicit`**

A handler can be defined implicitly, without the helper function.
In this case the handler is recognized by the function arguments.

::: warning **Note**

It is highly recommended to use the explicit variant, 
since this way the handler type does not have to be determined based on the function arguments.
In addition, only the explicit variant will be supported in the next major version.

:::

```typescript
const handler = (req, res, next) => {
    // ...
};
```

### Error
An **error** handler is a special kind of handler, 
which is only executed if an error occurred in a previous handler.

**`explicit`**

The **errorHandler** function should be used to define a handler function in the classical sense.
```typescript
import { errorHandler } from 'routup';

const handler = errorHandler((err, req, res, next) => {
    // ...
});
```

**`implicit`**

A handler can be defined implicitly, without the helper function.
In this case the handler is recognized by the function arguments.

::: warning **Note**

It is highly recommended to use the explicit variant,
since this way the handler type does not have to be determined based on the function arguments.
In addition, only the explicit variant will be supported in the next major version.

:::

```typescript
const handler = (err, req, res, next) => {
    // ...
};
```

## Declarations

Both core and error handlers, can be defined in two different ways.
Core handler functions can have up to 3 arguments (req, res, next) whereas error handler functions can have up to 4 arguments (err, req, res, next). 
This should be familiar to anyone who has used express before.

### Shorthand

With the shorthand variant, only the handler function is passed as argument to the **coreHandler** & **errorHandler** function.
This also corresponds to the way the handlers were declared in the [Types](#types) section.

```typescript
import { coreHandler } from 'routup';

const handler = coreHandler((req, res, next) => {
    // ...
});
```

### Verbose

The verbose variant is more complex, but offers the possibility to set additional information 
like **path**, **method**, ... in the handler definition.

```typescript
import { coreHandler } from 'routup';

const handler = coreHandler({
    method: 'GET',
    path: '/',
    fn: (req, res, next) => {
        // ...
    }
});
```

## Mounting

In the following it will be shown how a [handler](./handlers.md) can be mounted on different ways.


### Global

Mount a handler without any specific criteria,
making it available to process requests regardless of path and method.

```typescript
router.use(coreHandler(() => 'Hello, World!'));
```

### Method

Mount a handler based on the HTTP method `GET`.

```typescript
router.use(coreHandler({
    method: 'GET',
    fn: () => 'Hello, World!'
}));
```

The router also provides a method with the same syntax for each lowercase HTTP method (get, post, delete, ...).
```typescript
router.get(coreHandler(() => 'Hello, World!'));
router.post(/* ... */);
// ...
```

### Path

Mount a handler based on the path `/foo`.

```typescript
router.use('/foo', coreHandler(() => 'Hello, World!'));
```

### Path & Method

Mount a handler based on the path `/foo` and the HTTP method `GET`.

```typescript
router.use(coreHandler({
    method: 'GET',
    path: '/foo',
    fn: () => 'Hello, World!'
}));
```

The router also provides a method with the same syntax for each lowercase HTTP method (get, post, delete, ...).
```typescript
router.get('/foo', coreHandler(() => 'Hello, World!'));
router.post(/* ... */);
// ...
```
