# Auth Middleware

A middleware that checks a bearer token, hands the user to the handlers after it through `event.store`, and answers 401 otherwise. A route registered before the middleware stays public.

<<< @/../examples/auth-middleware/app.ts

## Try it

Install `routup`, serve the app from a second file and start it with your [runtime](/guide/runtime-environments):

```typescript
import { serve } from 'routup';
import { app } from './app.ts';

serve(app, { port: 3000 });
```

```bash
curl http://localhost:3000/health
# {"status":"ok"}

curl http://localhost:3000/me
# {"status":401,"message":"Unauthorized"}

curl http://localhost:3000/me -H 'authorization: Bearer wrong'
# {"status":401,"message":"Unauthorized"}

curl http://localhost:3000/me -H 'authorization: Bearer secret-token'
# {"name":"Alice"}
```

## How it works

- Handlers run in registration order. `/health` answers before the middleware is reached, so it needs no token. See [Registration order](/guide/custom-router#registration-order).
- `app.use(handler)` without a path runs the middleware for every request that gets to it; `event.next()` continues with the handlers after it. See [Global](/guide/app#global).
- `event.store` lives for one request and is shared by all its handlers. A `Symbol` key cannot collide with keys of other middleware or plugins. See [Data Sharing](/guide/request#data-sharing).
- An `AppError` that no error handler answers becomes the fallback response with its `status`. Its body is `{ status, message }` as JSON when the request accepts JSON (`curl` sends `Accept: */*`), plain text otherwise. See [Error Handling](/guide/error-handling).
