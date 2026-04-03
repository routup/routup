# Testing

## Setup

- **Framework**: Vitest
- **Environment**: Node.js
- **Config**: `test/vitest.config.ts`

> **Note**: The test suite is being rewritten for the v5 srvx-based API. Many existing tests reference the old `(req, res, next)` handler signatures and `createNodeDispatcher()` adapter, and will fail until updated.

## Running Tests

```bash
npm test               # Run all tests
npm run test:coverage  # Run with coverage report
```

## Test Structure

Tests live in `test/unit/` and mirror the `src/` directory structure:

```
test/
├── unit/
│   ├── dispatcher/     # Dispatch pipeline tests
│   ├── error/          # Error creation tests
│   ├── handler/        # Handler definition tests
│   ├── request/        # Request helper tests (body, cache, headers, hostname, IP, etc.)
│   ├── response/       # Response helper tests (cache, headers, to-response, etc.)
│   ├── router.spec.ts  # Router integration tests
│   ├── path.spec.ts    # Path matching tests
│   └── plugin.spec.ts  # Plugin system tests
├── data/               # Test fixtures (static files, etc.)
└── vitest.config.ts    # Vitest configuration
```

## Test Pattern

- File naming: `*.spec.ts`
- Tests use `supertest` for HTTP-level assertions via `toNodeHandler()` from srvx, or test `router.fetch()` directly with Web `Request` objects
- Typical pattern:

```typescript
import supertest from 'supertest';
import { toNodeHandler } from 'srvx/node';
import { Router, coreHandler } from '../../src';

const router = new Router();
router.get('/', coreHandler((event) => 'ok'));

// Option 1: supertest via toNodeHandler()
const server = supertest(toNodeHandler(router));
const response = await server.get('/');
expect(response.text).toBe('ok');

// Option 2: test router.fetch() directly
const response = await router.fetch(new Request('http://localhost/'));
expect(await response.text()).toBe('ok');
```

## Coverage

Coverage reports are generated in the `coverage/` directory and uploaded to Codecov in CI.
