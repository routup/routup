# Request Helpers

## `isRequestCachable`

This function compares the header `if-modified-since` with a passed Date information
and returns true if the client can keep the cached version.

```typescript
declare function isRequestCachable(
    req: Request, 
    modifiedTime: string | Date
) : boolean;
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

## `useRequestParams`

Receive all captured path parameter values.

```typescript
declare function useRequestParams(req: IncomingMessage) : Record<string, any>;
```
