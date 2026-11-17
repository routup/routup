# Event

Every handler receives an event: the request, its route parameters, the response under construction and the continuation to the next handler. The [Request guide](/guide/request) and the [Response guide](/guide/response) show it in use.

## `IAppEvent`

```typescript
interface IAppEvent {
    readonly request: AppRequest;
    readonly params: Record<string, string | undefined>;
    readonly path: string;
    readonly method: MethodNameLike;
    readonly mountPath: string;
    readonly route?: AppEventRoute;
    readonly headers: Headers;
    readonly searchParams: URLSearchParams;
    readonly response: AppResponse;
    readonly store: Record<string | symbol, unknown>;
    readonly appOptions: Readonly<AppOptions>;
    readonly signal: AbortSignal;
    next(error?: Error): Promise<Response | undefined>;
    readonly nextCalled: boolean;
    readonly nextResult: Promise<Response | undefined> | undefined;
    whenNextCalled(): Promise<void>;
}
```

The type of the `event` argument of every handler.

| Property | Type | Meaning |
|---|---|---|
| `request` | `AppRequest` | The request |
| `params` | `Record<string, string \| undefined>` | Route parameters; `undefined` for an optional parameter that did not match |
| `path` | `string` | Path of the request URL without the query string, also inside a mounted App |
| `method` | `MethodNameLike` | Request method |
| `mountPath` | `string` | The part of `path` the running handler's route matched; `/` for a route without a path |
| `route` | `AppEventRoute \| undefined` | The last method-bound route that ran in this request |
| `headers` | `Headers` | Request headers |
| `searchParams` | `URLSearchParams` | Query parameters, parsed on first read |
| `response` | `AppResponse` | Status and headers of the response under construction |
| `store` | `Record<string \| symbol, unknown>` | Per-request data shared between handlers |
| `appOptions` | `Readonly<AppOptions>` | Options of the App answering the request; see [`AppOptions`](/api/app#appoptions) |
| `signal` | `AbortSignal` | Aborts on a timeout or when the request is aborted; see [Timeouts](/guide/timeouts) |
| `next(error?)` | `Promise<Response \| undefined>` | Run the handlers after this one |
| `nextCalled` | `boolean` | Whether `next()` was called on this event |
| `nextResult` | `Promise<Response \| undefined> \| undefined` | The promise of the first `next()` call |
| `whenNextCalled()` | `Promise<void>` | Resolves once `next()` is called |

- Each handler gets its own event. `store`, `response` and `route` belong to the request and are shared by all of them. `params`, `mountPath` and `signal` can differ per handler.
- `route` is `undefined` until a method-bound route ran: in a middleware before its `event.next()`, and for a request that only middleware handled.

### event.next()

```typescript
next(error?: Error): Promise<Response | undefined>;
```

Runs the handlers matched after this one and resolves with their response, or `undefined` when none answered.

```typescript
app.use(defineCoreHandler(async (event) => {
    const start = Date.now();
    const response = await event.next();

    console.log(`${event.path} ${response?.status} ${Date.now() - start}ms`);

    return response;
}));
```

- Only the first call runs the handlers. Every later call returns the same promise.
- A handler that returns `undefined` after calling `next()` forwards its result. One that returns `undefined` without calling it waits until it does or `event.signal` aborts; see [Handlers](/guide/handlers#returning-undefined).
- `next(error)` makes `error` the pending error, so only error handlers run after it; see [Error Handling](/guide/error-handling#forwarding-with-event-next-error).
- It does not reject when a later handler throws. It resolves with the response of the error handler that answered, or `undefined`.

## `AppRequest`

```typescript
type AppRequest = ServerRequest;
```

The request type of [srvx](https://srvx.h3.dev): a Web `Request` with fields the server adapter fills in.

| Field | Type | Meaning |
|---|---|---|
| `ip` | `string \| undefined` | Client address as the runtime reports it; `getRequestIP()` also reads forwarding headers |
| `runtime` | `ServerRuntimeContext \| undefined` | Runtime name and native objects, such as `runtime.node.req` and `runtime.node.res` on Node.js |
| `context` | `ServerRequestContext \| undefined` | Arbitrary context of the request |
| `waitUntil` | `((promise: Promise<unknown>) => void \| Promise<void>) \| undefined` | Keep the runtime alive until `promise` settles |

A plain `Request` passed to `app.fetch()` has none of these fields.

## `AppResponse`

```typescript
type AppResponse = {
    status: number;
    headers: Headers;
};
```

The status and headers of `event.response`. They apply when a handler returns a plain value (string, object, `null`, ...), not when it returns a `Response`.

| Field | Type | Default | Meaning |
|---|---|---|---|
| `status` | `number` | `200` | Status of the response |
| `headers` | `Headers` | empty | Headers of the response |

```typescript
app.post('/users', defineCoreHandler((event) => {
    event.response.status = 201;
    event.response.headers.set('location', '/users/1');

    return { id: 1 };
}));
```

## `AppEventRoute`

```typescript
type AppEventRoute = {
    readonly path: string;
    readonly pathPrefix: string;
    readonly method: string;
};
```

The value of `event.route`.

| Field | Type | Meaning |
|---|---|---|
| `path` | `string` | The route's full pattern over every mount, such as `/api/users/:id` |
| `pathPrefix` | `string` | The part of `path` from the App's `path` option and the mount paths, `/` without any |
| `method` | `string` | The method the route is bound to; `GET` also when it serves a `HEAD` request |

See [Dispatched Route](/guide/request#dispatched-route).
