# Errors

Routup represents every failure of a request as an `AppError`, an HTTP error with a status. The [Error Handling guide](/guide/error-handling) explains how errors reach error handlers and the fallback response.

## `AppError`

```typescript
declare class AppError extends HTTPError {
    constructor(input?: HTTPErrorInput);
}
```

An error with an HTTP status, based on `HTTPError` of `@ebec/http`. It takes a message string or an options object.

```typescript
import { AppError } from 'routup';

throw new AppError({ status: 404, message: 'User not found' });
throw new AppError('Something failed'); // status 500
```

| Option | Type | Default | Meaning |
|---|---|---|---|
| `status` | `number \| string` | `500` | Status between 400 and 599 |
| `message` | `string` | reason phrase of `status` | Message |
| `code` | `string` | `'APP_ERROR'` | Identifier of the error |
| `cause` | `unknown` | none | The underlying error |
| `redirectURL` | `string` | none | A URL to redirect to |
| `errors` | `readonly Error[]` | none | Errors of a batch |
| `issues` | `readonly Issue[]` | `[]` | Validation failures |

- A `status` outside 400 to 599, or one that is not a number, becomes `500`.
- The options become properties of the same name, with the defaults above. `statusCode` is a deprecated alias of `status`.
- `toJSON()` returns `name`, `message`, `code`, `status` and an `@instanceof` marker list, plus `cause`, `errors` and `issues` when set.

## `createError`

```typescript
declare function createError(input: HTTPErrorInput | unknown): AppError;
```

Converts any value into an `AppError`. The pipeline applies it to every thrown value and to the argument of `event.next(error)`; the [conversion table](/guide/error-handling#throwing-errors) lists the results.

```typescript
import { createError } from 'routup';

createError('Bad input');             // status 500, message 'Bad input'
createError({ status: 400 });         // status 400, message 'Bad Request'
createError(new Error('Disk full'));  // status 500, cause: the Error
```

An `AppError` is returned as is, not copied.

## `isError`

```typescript
declare function isError(input: unknown): input is AppError;
```

Checks whether a value is an `AppError`.

```typescript
import { isError } from 'routup';

if (isError(e) && e.status === 404) {
    return null;
}
```

It checks a marker, not `instanceof`, so an `AppError` of another copy of routup also counts. A plain `Error` does not; see [Checking for an `AppError`](/guide/error-handling#checking-for-an-apperror).
