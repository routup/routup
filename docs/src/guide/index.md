# What is it?

**Routup** is a minimalistic, runtime-agnostic HTTP routing framework built on Web standard `Request` and `Response`. Handlers receive an event object (`IRoutupEvent`) and return values that are automatically converted to `Response` objects.

It runs on Node.js, Bun, Deno, Cloudflare Workers, and any runtime that supports the Web API.

## Quick Example

```typescript
import { Router, defineCoreHandler, serve } from 'routup';

const router = new Router();

router.get('/', defineCoreHandler((event) => {
    return { message: 'Hello, World!' };
}));

router.get('/users/:id', defineCoreHandler((event) => {
    return { id: event.params.id };
}));

serve(router, { port: 3000 });
```

## Features

- Built on Web standard APIs (Request/Response)
- Return-based response model — return strings, objects, Response, streams, and more
- Event-based handler signature: `(event) => value`
- Runtime agnostic (Node.js, Bun, Deno, Cloudflare Workers)
- Async/await support throughout
- Robust hook system (`request`, `response`, `error`)
- Powerful plugin system
- Tree-shakeable request and response helpers
- Nestable routers
- TypeScript support
- Minimalistic core with maximum flexibility
