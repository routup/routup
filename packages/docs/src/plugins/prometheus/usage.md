# Usage

The metrics collected in the following example, can be inspected on:
http://localhost:3000/metrics

The `registerMetrics` method, should be called before registering any routes!

```typescript
import { Router } from 'routup';
import {
    registerMetrics,
    createHandler
} from '@routup/prometheus';

const router = new Router();

// register 'uptime' & 'requestDuration' metrics
registerMetrics(router);

// serve metrics
router.use('/metrics', createHandler());

router.listen(3000);
```
