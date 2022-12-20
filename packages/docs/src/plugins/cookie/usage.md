# Usage

```typescript
import {Router, send} from 'routup';
import {
    setResponseCookie,
    useRequestCookie,
    useRequestCookies
} from '@routup/cookie';

const router = new Router();

router.get('/', (req, res) => {
    const cookies = useRequestCookies(req);
    console.log(cookies);
    // { key: value, ... }

    const cookie = useRequestCookie(req, 'foo');
    console.log(cookie);
    // value

    setResponseCookie(res, 'foo', 'bar');

    send(res, 'Hello World');
});

router.listen(3000);
```
