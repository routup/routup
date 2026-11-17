# Testing

## Setup

- **Framework**: Vitest
- **Environment**: Node.js
- **Config**: `test/vitest.config.ts`. It aliases `routup` and `routup/cloudflare` to the source and inlines the `@routup/*` plugins, so docs examples run against `src/` without a build

## Running Tests

```bash
npm test               # Run all tests
npm run test:coverage  # Run with coverage report
```

## Test Structure

Tests live in `test/unit/`:

```
test/
├── unit/
│   ├── app/            # App options, mounting (flatten), plugins, timeouts
│   ├── cache/          # LruCache
│   ├── docs/           # Landing page component logic, docs example apps (examples/), API page coverage of the exports (api-names.spec.ts)
│   ├── error/          # Error creation and chaining
│   ├── event/          # AppEvent
│   ├── handler/        # Handler definitions, adapters, lifecycle callbacks
│   ├── plugin/         # Plugin install and errors
│   ├── request/        # Request helpers (cache, headers, hostname, IP, etc.)
│   ├── response/       # Response helpers (cache, headers, send*, to-response)
│   ├── router/         # Router implementations and compliance suite
│   ├── routing/        # End-to-end routing, middleware, dispatch counts
│   └── utils/          # Shared utilities
├── data/               # Test fixtures (static files, etc.)
├── helpers.ts          # createTestRequest and event helpers
└── vitest.config.ts    # Vitest configuration
```

## Test Pattern

- File naming: `*.spec.ts`
- Tests call `app.fetch()` directly with `createTestRequest()` from `test/helpers.ts`
- Typical pattern:

```typescript
import { App, defineCoreHandler } from '../../src';
import { createTestRequest } from '../helpers';

const app = new App();
app.get('/', defineCoreHandler((event) => 'ok'));

const response = await app.fetch(createTestRequest('/'));
expect(await response.text()).toBe('ok');
```

## Coverage

Coverage reports are generated in the `coverage/` directory and uploaded to Codecov in CI.
