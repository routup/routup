# Modular Apps

Routes split into one App per resource, mounted on a root App under a path prefix.

<<< @/../examples/modular-apps/app.ts

## Try it

Install `routup`, serve the app from a second file and start it with your [runtime](/guide/runtime-environments):

```typescript
import { serve } from 'routup';
import { app } from './app.ts';

serve(app, { port: 3000 });
```

```bash
curl http://localhost:3000/users/1
# {"id":"1","name":"Alice"}

curl http://localhost:3000/posts/1
# {"id":"1","title":"Hello"}
```

## How it works

- `app.use('/users', users)` registers each route of `users` on `app` with `/users` in front of its path, so `/:id` becomes `/users/:id`. See [Nesting](/guide/app#nesting).
- Mounting copies the routes at the call. A route added to `users` after `app.use()` answers on `users` but is 404 on `app`, so register a child's routes before mounting it. See [Sub-apps are flattened at mount time](/guide/migration-v6#sub-apps-are-flattened-at-mount-time).
