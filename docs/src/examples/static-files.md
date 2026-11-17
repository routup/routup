# Static Files

A single-page app served from `public/` with [`@routup/assets`](https://plugins.routup.dev/assets/): files are sent as they are, any other path gets `index.html`, and `/api` paths reach the API routes instead.

<<< @/../examples/static-files/app.ts

`public/index.html`:

<<< @/../examples/static-files/public/index.html

`public/assets/app.js`:

<<< @/../examples/static-files/public/assets/app.js

## Try it

Install `routup` and `@routup/assets` (the plugin needs Node.js 24 or later), serve the app from a second file and start it with Node.js:

```typescript
import { serve } from 'routup';
import { app } from './app.ts';

serve(app, { port: 3000 });
```

```bash
curl -s -o /dev/null -w '%{content_type}\n' http://localhost:3000/assets/app.js
# text/javascript; charset=utf-8

curl -s http://localhost:3000/some/client/route | head -n 1
# <!doctype html>

curl http://localhost:3000/api/hello
# {"message":"Hello"}

curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/missing
# 404
```

## How it works

- A relative directory is resolved against the working directory of the process, so the example builds an absolute path to `public/` from `import.meta.url`.
- The plugin is registered before the API routes, so it runs first ([Registration order](/guide/custom-router#registration-order)). A request for an existing file gets the file with `Content-Type` from its name, a weak `ETag` and `Cache-Control: public,max-age=0,must-revalidate`; a file therefore wins over a route on the same path.
- With `fallback: 'index.html'`, a path that matches no file gets `index.html`, so the client-side router sees `/some/client/route`.
- `fallbackIgnores: ['^/api(/|$)']` keeps `/api` paths out of the fallback (each entry is a case-insensitive regular expression, and `(/|$)` keeps `/apiary` in it), and setting it also keeps out paths that end in a file name with an extension, such as `/assets/missing.js`. The plugin passes these requests on with `event.next()`: `/api/hello` reaches its route, and a path no handler answers gets 404.
- See the [plugin's options](https://plugins.routup.dev/assets/configuration) for caching, extensions and dotfiles.
