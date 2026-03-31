# Testing

## Setup

- **Framework**: Jest 30.2.0
- **Transformer**: @swc/jest (SWC for fast TypeScript compilation)
- **Environment**: Node.js
- **Config**: `test/jest.config.js`

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
│   ├── dispatcher/     # Dispatch pipeline tests (raw, web adapters)
│   ├── error/          # Error creation tests
│   ├── handler/        # Handler definition tests
│   ├── request/        # Request helper tests (cache, env, headers, hostname, IP, etc.)
│   ├── response/       # Response helper tests (cache, event-stream, headers, send-file, etc.)
│   ├── router.spec.ts  # Router integration tests
│   ├── path.spec.ts    # Path matching tests
│   └── plugin.spec.ts  # Plugin system tests
├── data/               # Test fixtures (static files, etc.)
└── jest.config.js      # Jest configuration
```

## Test Pattern

- File naming: `*.spec.ts`
- Tests use `supertest` for HTTP-level assertions against a real Node.js server
- Typical pattern: create a `Router`, register handlers, wrap with `createNodeDispatcher()`, test with `supertest`

```typescript
import supertest from 'supertest';
import { Router, coreHandler, createNodeDispatcher, send } from '../../src';

const router = new Router();
router.get('/', coreHandler((req, res) => send(res, 'ok')));

const server = supertest(createNodeDispatcher(router));
const response = await server.get('/');
expect(response.text).toBe('ok');
```

## Coverage Thresholds

Configured in `test/jest.config.js`:

| Metric | Threshold |
|--------|-----------|
| Branches | 58% |
| Functions | 77% |
| Lines | 73% |
| Statements | 73% |

Coverage reports are generated in the `coverage/` directory and uploaded to Codecov in CI.
