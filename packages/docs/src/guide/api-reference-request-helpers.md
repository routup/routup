# Request Helpers


## `setRequestBody`

This function sets the parsed request body/payload for the current request.
This method should be implemented by a router middleware/plugin.
Check the [body](./../plugins/body/) plugin for an example implementation.

```typescript
declare function setRequestBody(
    req: Request,
    key: string,
    value: unknown
) : void;

declare function setRequestBody(
    req: Request,
    record: Record<string, any>, 
    append?: boolean
) : void;
```

## `useRequestBody`

This function returns the parsed request payload.
This requires that the body is set by the [body](./../plugins/body/) plugin or a plugin with a similar function 
.

```typescript
declare function useRequestBody(
    req: Request
) : Record<string, any>;

declare function useRequestBody(
    req: Request, key: string
) : any | undefined;
```

## `isRequestCachable`

This function compares the header `if-modified-since` with a passed Date information
and returns true if the client can keep the cached version.

```typescript
declare function isRequestCachable(
    req: Request, 
    modifiedTime: string | Date
) : boolean;
```

## `setRequestCookies`

This function sets the parsed request cookies for the current request.
This method should be implemented by a router middleware/plugin.
Check the [cookie](./../plugins/cookie/) plugin for an example implementation.

```typescript
declare function setRequestCookies(
    req: IncomingMessage,
    record: Record<string, any>,
    mergeIt?: boolean,
) : void;
```

## `useRequestCookies`

This function returns the parsed request cookies.
This requires that the body is set by the [cookie](./../plugins/cookie/) plugin or a plugin with a similar function.

```typescript
declare function useRequestCookies(
    req: IncomingMessage,
) : Record<string, string>;
```

## `useRequestCookie`

This function returns a **single** parsed request cookies.
This requires that the body is set by the [cookie](./../plugins/cookie/) plugin or a plugin with a similar function.

```typescript
declare function useRequestCookie(
    req: IncomingMessage,
    name: string
) : string | undefined;
```

## `setRequestEnv`

Set a key-value pair for following handlers in the chain.

```typescript
declare function setRequestEnv(
    req: Request,
    key: string,
    value: unknown
) : void;
```

## `useRequestEnv`

Receive a value for a previous defined key-value pair by another handler.

```typescript
declare function useRequestEnv(
    req: Request,
    key: string,
    value: unknown
);
```

## `getRequestHeader`

Get a specific header of the current request.

```typescript
import { IncomingHttpHeaders } from 'node:http';

declare function getRequestHeader<K extends keyof IncomingHttpHeaders>(
    req: Request,
    name: K,
): IncomingHttpHeaders[K];
```

## `setRequestHeader`

Set or override a header of the current request.

```typescript
import { IncomingHttpHeaders } from 'node:http';

declare function setRequestHeader<K extends keyof IncomingHttpHeaders>(
    req: Request,
    name: K,
    value: IncomingHttpHeaders[K],
)
```

## `getRequestAcceptableContentTypes`

Get all acceptable charsets for the client request by reading the `Accept` header.

```typescript
declare function getRequestAcceptableContentTypes(
    req: IncomingMessage
) : string[]
```

## `getRequestAcceptableContentType`

Check if an acceptable content-type of the client request matches with
a user defined possibility by reading the `Accept` header.

```typescript
declare function getRequestAcceptableContentType(
    req: IncomingMessage,
    input?: string | string[]
) : string | undefined
```

## `getRequestAcceptableCharsets`

Get all acceptable charsets for the client request by reading the `Accept-Charset` header.

```typescript
declare function getRequestAcceptableCharsets(
    req: IncomingMessage
) : string[]
```

## `getRequestAcceptableCharset`

Check if an acceptable charset of the client request matches with
a user defined possibility by reading the `Accept-Charset` header.

```typescript
declare function getRequestAcceptableContentType(
    req: IncomingMessage,
    input?: string | string[]
) : string | undefined
```

## `getRequestAcceptableEncodings`

Get all acceptable encodings for the client request by reading the `Accept-Encoding` header.

```typescript
declare function getRequestAcceptableEncodings(
    req: IncomingMessage
) : string[]
```

## `getRequestAcceptableEncoding`

Check if an acceptable encodings of the client request matches with
a user defined possibility by reading the `Accept-Encoding` header.

```typescript
declare function getRequestAcceptableEncoding(
    req: IncomingMessage,
    input?: string | string[]
) : string | undefined
```

## `getRequestAcceptableLanguages`

Get all acceptable encodings for the client request by reading the `Accept-Language` header.

```typescript
declare function getRequestAcceptableLanguages(
    req: IncomingMessage
) : string[]
```

## `getRequestAcceptableLanguage`

Check if an acceptable encodings of the client request matches with
a user defined possibility by reading the `Accept-Language` header.

```typescript
declare function getRequestAcceptableLanguage(
    req: IncomingMessage,
    input?: string | string[]
) : string | undefined
```

## `matchRequestContentType`

Check if the `Content-Type` of the client request matches.

```typescript
declare function matchRequestContentType(
    req: Request, 
    contentType: string
) : boolean
```

## `getRequestHostname`

Get the host name of the current request.

```typescript
declare function getRequestHostName(
    req: Request,
    options?: RequestHostNameOptions
) : string | undefined;
```

```typescript
type RequestHostNameOptions = {
    trustProxy?: TrustProxyInput
};
```

- [TrustProxyInput](#trustproxyinput)

## `getRequestIP`

Get the IP Address of the current request.

```typescript
declare function getRequestIP(
    req: Request, 
    options?: RequestIpOptions
) : string;
```

## `useRequestMountPath`

Get the mount path for the current route-/middleware-handler.

```typescript
declare function useRequestMountPath(req: Request) : string;
```

## `useRequestParams`

Receive all captured path parameter values.

```typescript
declare function useRequestParams(req: IncomingMessage) : Record<string, any>;
```

## `useRequestParam`

Receive a captured path parameter value.

```typescript
declare function useRequestParam(req: IncomingMessage, key: string) : any;
```

## `useRequestPath`

Receive the relative request path of the request.

```typescript
declare function useRequestPath(req: Request) : string;
```

## `getRequestProtocol`

Receive the http protocol (**http** or **https**) of the request.

```typescript
declare function getRequestProtocol(
    req: Request,
    options?: RequestProtocolOptions,
) : string;
```

```typescript

type RequestProtocolOptions = {
    trustProxy?: TrustProxyInput,
    default?: string
};
```

- [TrustProxyInput](#trustproxyinput)

## `setRequestQuery`

This function sets the parsed request query parameters for the current request.
This method should be implemented by a router middleware/plugin.
Check the [query](./../plugins/query/) plugin for an example implementation.

```typescript
declare function setRequestQuery(
    req: Request,
    key: string,
    value: unknown
) : void;

declare function setRequestQuery(
    req: Request, 
    record: Record<string, any>,
    append?: boolean
) : void;
```

## `useRequestBody`

This function returns the query parameters of the request.
This requires that the query parameters are set by the [query](./../plugins/query/) plugin or a plugin with a similar function
.

```typescript
declare function useRequestQuery(
    req: Request
) : Record<string, any>;

declare function useRequestQuery(
    req: Request, 
    key: string
) : any;
```

## `TrustProxyInput`

```typescript
type TrustProxyFn = (address: string, hop: number) => boolean;

type TrustProxyInput = boolean | number | string | string[] | TrustProxyFn;
```
