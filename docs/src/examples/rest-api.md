# REST API

CRUD routes for todos over an in-memory store. Request bodies are read with [`@routup/body`](https://plugins.routup.dev/body/), and an unknown id answers 404.

<<< @/../examples/rest-api/app.ts

## Try it

Install `routup` and `@routup/body`, serve the app from a second file and start it with your [runtime](/guide/runtime-environments):

```typescript
import { serve } from 'routup';
import { app } from './app.ts';

serve(app, { port: 3000 });
```

```bash
curl -X POST http://localhost:3000/todos \
    -H 'content-type: application/json' \
    -d '{"title":"Write docs"}'
# {"id":1,"title":"Write docs","done":false}

curl -X PATCH http://localhost:3000/todos/1 \
    -H 'content-type: application/json' \
    -d '{"done":true}'
# {"id":1,"title":"Write docs","done":true}

curl http://localhost:3000/todos/99
# {"status":404,"message":"Todo 99 not found"}
```

## How it works

- `body()` turns on the JSON and URL-encoded parsers; `readRequestBody(event)` returns `{}` when the request's `content-type` matches neither, so the `curl` calls set it. See [Reading the Body](/guide/request#reading-the-body).
- `event.response.status` sets the status of the response built from the return value. See [Status and Headers](/guide/response#status-and-headers).
- Returning `null` sends an empty body with the status set on `event.response`. See [Return Values](/guide/response#return-values).
- An `AppError` that no error handler answers becomes the fallback response with its `status`. Its body is `{ status, message }` as JSON when the request accepts JSON (`curl` sends `Accept: */*`), plain text otherwise. See [Error Handling](/guide/error-handling).
