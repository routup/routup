# Request

The incoming request is represented as an object, which is injected into a handler function.

There, it can either be interacted with directly or so-called [helpers](../api/request-helpers.md) can be used,
which provide abstractions for the interaction and transformation with the incoming request.
For example, it may be necessary to access the IP address, Host, Path, etc. at different places.

## Data Sharing

To share data between handlers, it is recommended
to use the helpers [setRequestEnv](../api/request-helpers.md#setrequestenv)
and [useRequestEnv](../api/request-helpers.md#userequestenv).

```typescript
import { 
    coreHandler, 
    Router, 
    setRequestEnv, 
    useRequestEnv
} from 'routup';

const router = new Router();

router.use(coreHandler((req, res, next) => {
    setRequestEnv(req, 'foo', 'bar');
    next();
}));

router.use(coreHandler((req, res, next) => {
    const foo = useRequestEnv(req, 'foo');
    console.log(foo);
    // bar
}));
```

