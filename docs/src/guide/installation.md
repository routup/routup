# Installation

Install routup as a dependency. The srvx runtime is included automatically.

```sh
npm install routup
```

## Basic Setup

```typescript
import { Router, coreHandler, serve } from 'routup';

const router = new Router();

router.get('/', coreHandler((event) => {
    return 'Hello, World!';
}));

serve(router, { port: 3000 });
```

The correct runtime (Node.js, Bun, Deno, etc.) is selected automatically via conditional exports. All core exports (`Router`, `coreHandler`, `errorHandler`, helpers, etc.) and the runtime-specific `serve()` function are available from a single `routup` import.

See [Runtime Environments](./runtime-environments.md) for runtime-specific details and explicit entry points.
