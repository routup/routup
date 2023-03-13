/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

// eslint-disable-next-line max-classes-per-file
import {
    Next,
    Request,
    Response,
    send,
    useRequestParam,
} from 'routup';
import type { HandlerInterface } from '../../src';
import {
    DController,
    DDelete,
    DGet,
    DNext,
    DPatch,
    DPath,
    DPaths,
    DPost,
    DPut,
    DRequest,
    DResponse,
} from '../../src';

export class DeleteMiddleware implements HandlerInterface {
    run(request: Request, response: Response, next: Next): Promise<void> | void {
        const id = useRequestParam(request, 'id');

        if (typeof id !== 'string' || id.length < 3) {
            throw new Error();
        }

        next();
    }
}

@DController('/combined')
export class CombinedController {
    @DGet('')
    async getMany(
    @DRequest() req: Request,
        @DResponse() res: Response,
        @DNext() next: Next,
    ) {
        send(res, 'many');
    }

    @DGet('/:id')
    async getOne(
    @DRequest() req: Request,
        @DResponse() res: Response,
        @DPath('id') id: string,
    ) {
        send(res, id);
    }

    @DPost('')
    async create(
    @DRequest() req: Request,
        @DResponse() res: Response,
    ) {
        send(res, 'create');
    }

    @DPut('')
    async put(
    @DRequest() req: Request,
        @DResponse() res: Response,
    ) {
        send(res, 'put');
    }

    @DPatch('')
    async patch(
    @DRequest() req: Request,
        @DResponse() res: Response,
    ) {
        send(res, 'patch');
    }

    @DDelete('/:id', [DeleteMiddleware])
    async delete(
    @DRequest() req: Request,
        @DResponse() res: Response,
        @DPaths() data: { id: string },
    ) {
        send(res, data);
    }
}