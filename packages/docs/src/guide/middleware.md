# Middlewares

A middleware is a [handlers](./handler.md) which does not finally process the request. 
Instead, it calls the `next()` callback function, to execute the next handler in the chain.

::: warning **Note**

Express middleware libraries (like body-parser, multer, ...) should work out of the box 🔥.

:::

```typescript
import { Router } from 'routup';

const router = new Router();

const middleware = (req, res, next) => {
    console.log('My amazing middleware 🥳');
    next();
};

router.use(middleware);
```
