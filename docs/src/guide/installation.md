# Installation

Install routup as a dependency. The srvx runtime is included automatically.

```sh
npm install routup
```

## Basic Setup

```typescript
import { Router, coreHandler, serve } from 'routup/node';

const router = new Router();

router.get('/', coreHandler((event) => {
    return 'Hello, World!';
}));

serve(router, { port: 3000 });
```

## Runtime-specific Imports

Each runtime has its own entry point that provides the `serve()` function (and `toNodeHandler()` for Node.js):

```typescript
import { serve } from 'routup/node';
import { serve } from 'routup/bun';
import { serve } from 'routup/deno';
import { serve } from 'routup/cloudflare';
import { serve } from 'routup/service-worker';
import { serve } from 'routup/generic';
```

All core exports (`Router`, `coreHandler`, `errorHandler`, helpers, etc.) are available from every entry point.
