# Usage

```typescript
import { Router, send, useRequestBody } from 'routup';
import { createRequestParser } from '@routup/body';

const router = new Router();
// This will parse requests with Content-Type:
// application/json
// application/x-www-form-urlencoded
router.use(createRequestParser());

router.get('/', (req, res) => {
    const body = useRequestBody(req);
    console.log(body);
    // ...

    send(res, 'Hello World');
});

router.listen(3000);
```
