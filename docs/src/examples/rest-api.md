# REST API

CRUD routes for todos over an in-memory store. Request bodies are read with [`@routup/body`](https://plugins.routup.dev/body/), and an unknown id answers 404.

<<< @/../examples/rest-api/app.ts

## Try It

Install `routup` and `@routup/body` (the plugin needs Node.js 24 or later), serve the app from a second file and start it with your runtime as on the [Quickstart](/guide/quickstart#run-it):

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

## How It Works

- `body()` turns on the JSON and URL-encoded parsers; `readRequestBody(event)` returns `{}` when the request's `content-type` matches neither, so the `curl` calls set it. See [Reading the Body](/guide/request#reading-the-body).
- `event.response.status` sets the status of the response built from the return value. See [Status and Headers](/guide/response#status-and-headers).
- Returning `null` sends an empty body with the status set on `event.response`. See [Return Values](/guide/response#return-values).
- The 404 `AppError` of `findTodo()` reaches no error handler, so it becomes the [fallback response](/guide/error-handling#fallback-response) with status 404.
