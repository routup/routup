# Handler

A handler is a function, which can process an incoming request, manipulate the request- /response-object or pass the task
to next matching handler in the stack.

A **basic** handler can have up to **3** arguments. The first argument is the request object, the second argument the response object
and the last argument is a function, which can be used to call the next handler.

```typescript
import { Handler, Next, Request, Response } from 'routup';

const handler: Handler = (
    req: Request,
    res: Response,
    next: Next
) => {
    // ...
}
```

An **error** handler is a special kind of handler, which is only executed if an error occurred in a previous handler. Therefore, it receives an additional error object as first argument.

```typescript
import { ErrorHandler, Next, Request, Response } from 'routup';

const errorHandler : ErrorHandler = (
    error: Error, 
    req: Request,
    res: Response, 
    next: Next
) => {
    // ...
}
```
