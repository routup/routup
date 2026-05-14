# Installation

Install routup as a dependency. Runtime adapters are included automatically.

```sh
npm install routup
```

## Basic Setup

```typescript
import { App, defineCoreHandler, serve } from 'routup';

const app = new App();

app.get('/', defineCoreHandler((event) => {
    return 'Hello, World!';
}));

serve(app, { port: 3000 });
```

The correct runtime (Node.js, Bun, Deno, etc.) is selected automatically via conditional exports. All core exports (`App`, `defineCoreHandler`, `defineErrorHandler`, helpers, etc.) and the runtime-specific `serve()` function are available from a single `routup` import.

See [Runtime Environments](./runtime-environments.md) for runtime-specific details and explicit entry points.
