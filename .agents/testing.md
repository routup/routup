# Testing

## Setup

- **Framework**: Vitest
- **Environment**: Node.js
- **Config**: `test/vitest.config.ts`

> **Note**: The test suite has been rewritten for the v5 srvx-based API. Tests use `router.fetch()` with Web `Request` objects directly.

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
import { Router, coreHandler } from '../../src';
import { createTestRequest } from '../helpers';

const router = new Router();
router.get('/', coreHandler((event) => 'ok'));

const response = await router.fetch(createTestRequest('/'));
expect(await response.text()).toBe('ok');
```

## Coverage

Coverage reports are generated in the `coverage/` directory and uploaded to Codecov in CI.
