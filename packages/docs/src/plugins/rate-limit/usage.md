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
Besides the memory store this library also provides a redis store, but for this it is necessary to install the library
`redis-extension`.

```typescript
import { Router } from 'routup';
import { 
    createHandler, 
    RedisStore
} from '@routup/rate-limit'

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
