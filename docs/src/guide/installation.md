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

## Runtime-specific Imports

Routup auto-selects the correct runtime adapter via conditional exports. You can also import from a specific runtime:

```typescript
import { serve } from 'routup/node';
import { serve } from 'routup/bun';
import { serve } from 'routup/deno';
import { serve } from 'routup/cloudflare';
import { serve } from 'routup/service-worker';
import { serve } from 'routup/generic';
```
