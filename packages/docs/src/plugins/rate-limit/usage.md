# Usage

```typescript
import { Router } from 'routup';
import {
    createHandler
} from '@routup/rate-limit';

const router = new Router();

router.use(createHandler({
    // 15 minutes
    windowMs: 15 * 60 * 1000,

    // Limit each IP to 100 requests
    // per `window` (here, per 15 minutes)
    max: 100,
}));

router.listen(3000);
```

## Store

To create a custom Store it is mandatory to extend the `Store` interface.
The following adapters are officially provided:
- [@routup/rate-limit-redis](./../rate-limit-redis/index.md)
