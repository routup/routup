/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

// eslint-disable-next-line max-classes-per-file
import type { Next } from 'routup';
import {
    Request,
    Response,
    send,
    setRequestEnv,
    useRequestEnv,
} from 'routup';
import type { HandlerInterface } from '../../src';
import {
    DController,
    DGet, DHeader,
    DHeaders,
    DRequest,
    DResponse,
} from '../../src';

class DummyMiddleware implements HandlerInterface {
    run(request: Request, response: Response, next: Next): Promise<void> | void {
        setRequestEnv(request, 'key', 'value');

        next();
    }
}

@DController('/', [DummyMiddleware])
export class DummyController {
    @DGet('/headers')
    async headers(
    @DRequest() req: Request,
        @DResponse() res: Response,
        @DHeaders() headers: Record<string, any>,
    ) {
        send(res, headers);
    }

    @DGet('/header')
    async header(
    @DRequest() req: Request,
        @DResponse() res: Response,
        @DHeader('connection') header: string,
    ) {
        send(res, header);
    }

    @DGet('/middleware')
    async middleware(
    @DRequest() req: Request,
        @DResponse() res: Response,
    ) {
        send(res, useRequestEnv(req, 'key'));
    }
}
