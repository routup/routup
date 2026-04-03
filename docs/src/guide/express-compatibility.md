# Express Compatibility

It is very easy to switch from express to routup as well as to use existing extensions or middlewares of express.

This will be demonstrated in the following using the express middleware 
[cors](https://www.npmjs.com/package/cors) as an example.

Normally the middleware would be used in express as follows.

```typescript
import express from 'express';
import cors from 'cors';

const app = express()
 
app.use(cors());

// ...
```

To define a middleware or handler in routup, the auxiliary function `coreHandler` or `errorHandler` must be used. 
The arguments of the handler must only be passed to the cors middleware. 
Thus, the cors library can be used in the routup ecosystem.

```typescript
import { coreHandler, Router } from 'routup';
import cors from 'cors';

const router = new Router();

router.use(coreHandler((req, res, next) => cors()(req, res, next)));

// ...
```

That's it, now you are ready to go :tada:.
