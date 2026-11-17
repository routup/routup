# Handlers

Handlers answer requests. `defineCoreHandler()` and `defineErrorHandler()` create them, and the adapters wrap handlers written for Node.js or the Fetch API. The [Handlers guide](/guide/handlers) explains return values and middleware.

## Factories

### `defineCoreHandler`

```typescript
declare function defineCoreHandler(input: Omit<CoreHandlerOptions, 'type'>): Handler;
declare function defineCoreHandler(input: CoreHandler): Handler;

type CoreHandler = (event: IAppEvent) => unknown | Promise<unknown>;
```

Creates a handler that runs while no error is pending. It takes the function alone, or [options](#handlerbaseoptions) with the function as `fn`.

```typescript
app.get('/users/:id', defineCoreHandler((event) => {
    return { id: event.params.id };
}));

app.use(defineCoreHandler({
    path: '/health',
    method: 'GET',
    timeout: 500,
    fn: () => 'ok',
}));
```

### `defineErrorHandler`

```typescript
declare function defineErrorHandler(input: Omit<ErrorHandlerOptions, 'type'>): Handler;
declare function defineErrorHandler(input: ErrorHandler): Handler;

type ErrorHandler = (error: AppError, event: IAppEvent) => unknown | Promise<unknown>;
```

Creates a handler that runs only while an error is pending and receives it as an [`AppError`](/api/errors#apperror). It handles errors of the handlers registered before it; see [Error Handling](/guide/error-handling).

```typescript
app.use(defineErrorHandler((error, event) => {
    event.response.status = error.status;

    return { message: error.message };
}));
```

## Options

### `HandlerBaseOptions`

```typescript
type HandlerBaseOptions = {
    method?: Uppercase<MethodName> | Lowercase<MethodName>,
    path?: Path,
    timeout?: number,
    onBefore?: HandlerBeforeListener,
    onAfter?: HandlerAfterListener,
    onError?: HandlerErrorListener,
};
```

The options both factories accept next to `fn`.

| Name | Type | Default | Meaning |
|---|---|---|---|
| `method` | `MethodName`, upper or lower case | none: every method | Method the handler answers; `GET` also answers `HEAD` |
| `path` | `Path` | none | Path appended to the path the handler is registered under; see [Paths](/guide/paths) |
| `timeout` | `number` | the App's `handlerTimeout` | Milliseconds for `fn`; see [Timeouts](/guide/timeouts) |
| `onBefore` | `(event) => unknown` | none | Runs before `fn` |
| `onAfter` | `(event, response) => unknown` | none | Runs after the return value of `fn` became a `Response` |
| `onError` | `(error, event) => unknown` | none | Runs when `fn`, `onBefore` or `onAfter` throws |

- A method shortcut (`app.get()`, ...) replaces `method`.
- With a `method`, the handler matches its path exactly. Without one, it matches every path that starts with its path, as middleware does.
- The callbacks are explained in [Lifecycle Callbacks](/guide/lifecycle-callbacks). Their return values are ignored.

### `CoreHandlerOptions`

```typescript
type CoreHandlerOptions = HandlerBaseOptions & {
    type: typeof HandlerType.CORE,
    fn: CoreHandler,
};
```

The options of a core handler. `defineCoreHandler()` sets `type`.

### `ErrorHandlerOptions`

```typescript
type ErrorHandlerOptions = HandlerBaseOptions & {
    type: typeof HandlerType.ERROR,
    fn: ErrorHandler,
};
```

The options of an error handler. `defineErrorHandler()` sets `type`.

## Adapters

### `fromNodeHandler`

```typescript
declare function fromNodeHandler(handler: NodeHandler): Handler;

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => unknown | Promise<unknown>;
```

Wraps a Node.js `(req, res)` handler. It ends the pipeline: the handlers after it do not run.

```typescript
app.use('/legacy', fromNodeHandler((req, res) => {
    res.end('Hello from Node.js');
}));
```

- It needs a Node.js server that exposes `req` and `res`; under `app.fetch()` with a plain `Request` the request answers 500. See [Express Compatibility](/guide/express-compatibility).
- Passing something other than a function throws an `AppError` when the handler is created.

### `fromNodeMiddleware`

```typescript
declare function fromNodeMiddleware(handler: NodeMiddleware): Handler;

type NodeMiddleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
) => unknown | Promise<unknown>;
```

Wraps a Node.js `(req, res, next)` middleware, such as one written for Express.

```typescript
import cors from 'cors';

app.use(fromNodeMiddleware(cors()));
```

- `next()` continues with the next routup handler, unless the middleware already ended the response. `next(error)` makes `error` the pending error.
- The same Node.js server requirement as `fromNodeHandler()` applies.

### `fromWebHandler`

<Badge type="warning" text="experimental" />

```typescript
declare function fromWebHandler(input: WebHandler): Handler;
declare function fromWebHandler(input: WebHandlerProvider): Handler;

interface WebHandler {
    (request: Request): Response | Promise<Response>;
}

interface WebHandlerProvider {
    fetch(request: Request): Response | Promise<Response>;
}
```

Wraps a function or object that answers a Fetch API `Request`, such as another framework's app.

```typescript
app.use('/proxy', fromWebHandler((request) => fetch(request)));
```

- It passes `event.request` on unchanged. The URL keeps the mount path: a handler mounted at `/proxy` sees `/proxy/...`, not `/...`.
- Its return value is the response; the handlers after it do not run.
- Passing something other than a function or an object with a `fetch` method throws an `AppError` when the handler is created.
