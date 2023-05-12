# Usage

```typescript
import { Router } from 'routup';
import { createHandler } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';

const router = new Router();

const handler = createHandler({
    // 15 minutes
    windowMs: 15 * 60 * 1000,
    
    // Limit each IP to 100 requests
    // per `window` (here, per 15 minutes)
    max: 100, 
    
    // connection string or ioredis instance 
    // can be passed optional as argument 
    store: new RedisStore(), 
})

// Apply the rate limiting middleware to API calls only
router.use('/api', handler);

router.listen(3000);
```
