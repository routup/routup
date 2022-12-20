# Usage

```typescript
import { Router, send } from 'routup';
import {
    useRequestQuery
} from '@routup/query';

const router = new Router();

router.get('/', (req, res) => {
    const query = useRequestQuery(req);
    console.log(query);
    // { key: value, ... }

    send(res, 'Hello World');
});

router.listen(3000);
```
