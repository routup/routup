# Building blocks

The building blocks routup uses internally, exported for plugin authors and integrations: type guards, plugin errors, the classes behind handlers and events, path matching, response conversion and constants. An application built from the [Guide](/guide/) does not need them. [Plugin Authoring](/guide/plugin-authoring/) shows how plugins use them.

## Type guards

### `isHandler`

```typescript
declare function isHandler(input: unknown): input is Handler;
```

Checks whether a value is a [`Handler`](#handler), as returned by `defineCoreHandler()`, `defineErrorHandler()` and the adapters. It checks a marker, not `instanceof`, so a handler of another copy of routup also counts.

### `isHandlerOptions`

```typescript
declare function isHandlerOptions(input: unknown): input is HandlerOptions;
```

Checks whether a value is an object with a function `fn` and a string `type`, the shape `app.use()` accepts in place of a `Handler`.

### `isPlugin`

```typescript
declare function isPlugin(input: unknown): input is Plugin;
```

Checks whether a value is a [plugin](/guide/plugin-authoring/#the-plugin-interface): an object whose `install` is a function declaring exactly one parameter, and whose `name` is a string or absent.

### `isPluginError`

```typescript
declare function isPluginError(input: unknown): input is PluginError;
```

Checks whether a value is an `AppError` whose `code` is one of the [`PluginErrorCode`](#pluginerrorcode) values. A `PluginError` created with another `code` does not count.

### `isWebHandlerProvider`

```typescript
declare function isWebHandlerProvider(input: unknown): input is WebHandlerProvider;
```

Checks whether a value is an object with a `fetch` function, which [`fromWebHandler()`](/api/handlers#fromwebhandler) calls. An `App` counts.

## Plugin errors

### `PluginError`

```typescript
declare class PluginError extends AppError {
    constructor(input?: HTTPErrorInput);
}
```

The base class of the plugin errors. It takes the options of [`AppError`](/api/errors#apperror); `code` defaults to `'PLUGIN'` and the status to `500`.

### `PluginNotInstalledError`

```typescript
declare class PluginNotInstalledError extends PluginError {
    readonly pluginName: string;
    readonly helperName: string;

    constructor(pluginName: string, helperName: string);
}
```

The error a plugin's helper throws when it is called on an App without the plugin; see [Plugin Conventions](/guide/plugin-authoring/conventions#failing-loudly-when-a-dep-helper-is-called-too-early). Its `code` is `'PLUGIN_NOT_INSTALLED'`.

```typescript
throw new PluginNotInstalledError('cookie', 'useRequestCookie');
// message: useRequestCookie() requires the "cookie" plugin. Register it with: router.use(cookie())
```

### `PluginInstallError`

```typescript
declare class PluginInstallError extends PluginError {
    readonly pluginName: string;

    constructor(pluginName: string, cause?: Error);
}
```

An error for a plugin whose installation failed, with the message `Failed to install plugin "<name>".` and the code `'PLUGIN_INSTALL'`. Routup does not throw it itself: an error thrown by `install()` reaches the caller of `app.use()` unchanged.

### `PluginErrorCode`

```typescript
const PluginErrorCode = {
    PLUGIN: 'PLUGIN',
    NOT_INSTALLED: 'PLUGIN_NOT_INSTALLED',
    INSTALL: 'PLUGIN_INSTALL',
} as const;
```

The `code` values of the plugin errors.

## Handlers and events

### `Handler`

```typescript
declare class Handler {
    constructor(handler: HandlerOptions);

    readonly method: MethodName | undefined;
    get type(): HandlerType;
    get path(): Path | undefined;
}
```

The object the [handler factories](/api/handlers) return and `app.use()` registers. Its constructor takes `HandlerOptions`, which is `CoreHandlerOptions | ErrorHandlerOptions`. The factories set `type`; the constructor adds a leading `/` to `path` and converts `method` to upper case.

### `HandlerType`

```typescript
const HandlerType = {
    CORE: 'core',
    ERROR: 'error',
} as const;
```

The `type` of a handler: `'core'` runs while no error is pending, `'error'` only while one is.

### `AppEvent`

```typescript
declare class AppEvent implements IAppEvent {
    constructor(context: AppEventContext);
}
```

The class of the [event](/api/event) every handler receives. Routup creates one for each handler; constructing one yourself lets a helper run outside a request. The table lists the fields of `AppEventContext`; `AppEventCreateContext` is a deprecated alias of it.

| Name | Type | Meaning |
|---|---|---|
| `request` | `AppRequest` | The request |
| `params` | `Record<string, string \| undefined>` | Route parameters |
| `path` | `string` | Request path |
| `method` | `MethodNameLike` | Request method |
| `mountPath` | `string` | Path prefix the handler's route consumed |
| `headers` | `Headers` | Request headers |
| `searchParams` | `URLSearchParams` | Optional; the query, parsed |
| `search` | `string` | Optional; the query string, parsed on the first read of `searchParams` when `searchParams` is omitted |
| `response` | `AppResponse` | Status and headers of the response |
| `store` | `Record<string \| symbol, unknown>` | Per-request data |
| `signal` | `AbortSignal` | Abort signal of the handler |
| `appOptions` | `Readonly<AppOptions>` | Options of the App |
| `route` | `() => AppEventRoute \| undefined` | Optional; read on every access of `event.route` |
| `next` | `(event: IAppEvent, error?: Error) => Promise<Response \| undefined>` | Called by the first `event.next()`; later calls return its promise |

## Paths

### `PathMatcher`

```typescript
declare class PathMatcher implements IPathMatcher {
    constructor(path: Path, options?: PathMatcherOptions);

    test(path: string): boolean;
    exec(path: string): PathMatcherExecResult | undefined;
}

type PathMatcherExecResult = {
    path: string,
    params: Record<string, any>,
};
```

Matches request paths against a route path with [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp); the syntax is on [Paths](/guide/paths). The options, `PathMatcherOptions`, are those of `path-to-regexp` (`end`, `trailing`, `sensitive`, `delimiter`, `encodePath`); `end: false` matches a prefix.

```typescript
import { PathMatcher } from 'routup';

const matcher = new PathMatcher('/users/:id');

matcher.exec('/users/a%20b'); // { path: '/users/a%20b', params: { id: 'a b' } }
matcher.exec('/users');       // undefined
```

`IPathMatcher` is the interface of its `exec()` method, the type [`buildRoutePathMatcher()`](/api/routers#buildroutepathmatcher) returns.

## Responses

### `toResponse`

```typescript
declare function toResponse(
    value: unknown,
    event: IAppEvent,
): Response | undefined | Promise<Response | undefined>;
```

Converts a handler's return value into a `Response` with the status and headers of `event.response`, following the [return value rules](/guide/response#return-values). Routup calls it for every handler.

- `undefined` gives `undefined`.
- It returns a promise when it computes an [ETag](/api/app#appoptions), which it does for string and JSON bodies unless `etag` is off.

### `serializeEventStreamMessage`

```typescript
declare function serializeEventStreamMessage(message: EventStreamMessage): string;
```

Formats a message in the server-sent events format, as [`createEventStream()`](/api/response-helpers#createeventstream) writes it.

```typescript
serializeEventStreamMessage({ id: '1', event: 'tick', data: 'a\nb' });
// 'id: 1\nevent: tick\ndata: a\ndata: b\n\n'
```

- Each line of `data` becomes a `data:` line. Line breaks in `id` and `event` are removed.
- `retry` is written only when it is a safe integer.

### `serializeEventStreamComment`

```typescript
declare function serializeEventStreamComment(comment: string): string;
```

Formats a comment in the server-sent events format: each line prefixed with `: `, followed by an empty line. `serializeEventStreamComment('ping')` gives `': ping\n\n'`.

## Requests

### `useRequestNegotiator`

```typescript
declare function useRequestNegotiator(event: IAppEvent): Negotiator;
```

Returns a [`negotiator`](https://github.com/jshttp/negotiator) instance for the request headers, created once per request and kept in `event.store`. The `getRequestAcceptable*` [request helpers](/api/request-helpers) use it.

## Constants

### `MethodName`

```typescript
const MethodName = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
    OPTIONS: 'OPTIONS',
    HEAD: 'HEAD',
} as const;
```

The HTTP methods the App has shortcuts for. The type `MethodNameLike` is `MethodName` or any other string.

### `HeaderName`

```typescript
const HeaderName = {
    ACCEPT: 'accept',
    CONTENT_TYPE: 'content-type',
    ETag: 'etag',
    X_FORWARDED_FOR: 'x-forwarded-for',
    // ...
} as const;
```

Lower-case names of the HTTP headers routup reads or writes, from `ACCEPT` to `X_FORWARDED_PROTO`. The full list is in [`src/constants.ts`](https://github.com/routup/routup/blob/master/src/constants.ts).
