# Express Middleware

A Node.js `(req, res, next)` middleware that sets an `X-Request-Id` header, wrapped with `fromNodeMiddleware` and placed in front of a routup route. The middleware is hand-written here; an Express middleware from npm, such as `cors()`, is wrapped the same way.

<<< @/../examples/express-middleware/app.ts

## Try it

Install `routup`, serve the app from a second file and start it with Node.js:

```typescript
import { serve } from 'routup';
import { app } from './app.ts';

serve(app, { port: 3000 });
```

```bash
curl -i http://localhost:3000/
# HTTP/1.1 200
# X-Request-Id: e58fa4b8-e24e-4236-903d-24abe7f1d1e6
# content-type: text/plain; charset=utf-8
# ...
#
# Hello
```

The id is a new UUID on every request.

## How it works

- `fromNodeMiddleware` calls the middleware with the Node.js `req` and `res` of the server. When the middleware calls `next()` without ending the response, the pipeline continues with the next handler; `next(error)` hands the error to the error handlers.
- A header set with `res.setHeader()` is sent together with the response that the routup handler returns.
- The wrapper needs a Node.js server, so the app answers 500 under `app.fetch()` with a plain `Request`. See [How it Works](/guide/express-compatibility#how-it-works) for the requirement and how to test such an app, and [Limitations](/guide/express-compatibility#limitations) for the limits of the bridge.
