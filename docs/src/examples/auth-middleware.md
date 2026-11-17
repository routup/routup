# Auth Middleware

A middleware that checks a bearer token, hands the user to the handlers after it through `event.store`, and answers 401 otherwise. A route registered before the middleware stays public.

<<< @/../examples/auth-middleware/app.ts

## Try It

Install `routup`, serve the app from a second file and start it with your runtime as on the [Quickstart](/guide/quickstart#run-it):

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

## How It Works

- Handlers run in registration order. `/health` answers before the middleware is reached, so it needs no token. See [Registration order](/guide/custom-router#registration-order).
- `app.use(handler)` without a path runs the middleware for every request that gets to it; `event.next()` continues with the handlers after it. An unknown path without a valid token therefore answers 401, not 404. See [Global](/guide/app#global).
- The token is a constant to keep the example short. A real app verifies it with its auth library, or compares it in constant time.
- `event.store` lives for one request and is shared by all its handlers. A `Symbol` key cannot collide with keys of other middleware or plugins. See [Data Sharing](/guide/request#data-sharing).
- The 401 `AppError` reaches no error handler, so it becomes the [fallback response](/guide/error-handling#fallback-response) with status 401.
