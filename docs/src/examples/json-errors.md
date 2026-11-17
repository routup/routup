# JSON Errors

One error handler that turns every error thrown by a route into a JSON body with the error's status.

<<< @/../examples/json-errors/app.ts

## Try it

Install `routup`, serve the app from a second file and start it with your [runtime](/guide/runtime-environments):

```typescript
import { serve } from 'routup';
import { app } from './app.ts';

serve(app, { port: 3000 });
```

```bash
curl http://localhost:3000/validate
# {"error":{"status":422,"message":"Name is required"}}

curl http://localhost:3000/crash
# {"error":{"status":500,"message":"boom"}}

curl http://localhost:3000/unknown
# {"status":404,"message":"Not Found"}
```

## How it works

- An error handler runs only while an error is pending, and only if it comes after the handler that threw. Registering it after the routes puts it there. See [Error Handling](/guide/error-handling).
- The `error` argument is always an `AppError`. A thrown `Error` is wrapped with status 500 and its `message`, so the message reaches the client.
- `event.response.status` sets the status of the response built from the return value. See [Status and Headers](/guide/response#status-and-headers).
- An unknown path raises no error, so the error handler does not run. The App answers with its 404 fallback: `{ status, message }` as JSON when the request accepts JSON, plain text `Not Found` otherwise.
