# Usage

```typescript
import { Router, send } from 'routup';
import { 
    createRequestHandler,
    useRequestQuery
} from '@routup/query';

const router = new Router();

router.use(createRequestHandler());

router.get('/', (req, res) => {
    const query = useRequestQuery(req);
    console.log(query);
    // { key: value, ... }

    send(res, 'Hello World');
});

router.listen(3000);
```
