# Middlewares

Middlewares can be injected by using the `use()` method of a router instance.

::: info **Note**

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
