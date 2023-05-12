# Usage

## Controller

The first step is to define a Controller.

`controller.ts`
```typescript
import {
    DBody,
    DController,
    DDelete,
    DGet,
    DNext,
    DParam,
    DPost,
    DRequest,
    DResponse,
} from '@routup/decorators';

import {
    Next,
    Request,
    Response,
    send,
} from 'routup';

@DController('/users')
export class UserController {
    @DGet('')
    async getMany(
        @DRequest() req: Request,
        @DResponse() res: Response,
        @DNext() next: Next
    ) {
        send(res, 'many');
    }

    @DGet('/:id')
    async getOne(
        @DRequest() req: Request,
        @DResponse() res: Response,
        @DParam('id') id: string,
    ) {
        send(res, id);
    }

    @DPost('')
    async create(
        @DRequest() req: Request,
        @DResponse() res: Response,
        @DBody() body: any,
    ) {
        send(res, 'create');
    }

    @DDelete('/:id', [])
    async delete(
        @DRequest() req: Request,
        @DResponse() res: Response,
        @DParam('id') id: string,
    ) {
        send(res, id);
    }
}
```

## Mount

The last step is to mount the controller to a router instance, using the `mountController` function to mount a single controller,
or the `mountControllers` function to mount a collection of controllers.

`app.ts`
```typescript
import { mountControllers } from "@routup/decorators";
import { Router } from 'routup';

const router = new Router();

mountControllers(router, [
    UserController
]);

router.listen(3000);

```
