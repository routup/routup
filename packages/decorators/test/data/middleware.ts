/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Next } from '@routup/core';
import {
    Request, Response, send, setRequestEnv, useRequestEnv,
} from '@routup/core';
import type { HandlerInterface } from '../../src';
import {
    DController, DGet, DRequest, DResponse,
} from '../../src';

class DummyMiddleware implements HandlerInterface {
    run(request: Request, response: Response, next: Next): Promise<void> | void {
        setRequestEnv(request, 'key', 'value');

        next();
    }
}

@DController('/middleware', [DummyMiddleware])
export class MiddlewareController {
    @DGet('')
    async middleware(
    @DRequest() req: Request,
        @DResponse() res: Response,
    ) {
        send(res, useRequestEnv(req, 'key'));
    }
}
