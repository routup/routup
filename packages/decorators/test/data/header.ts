/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    Request,
    Response,
    send,
    useRequestEnv,
} from 'routup';
import {
    DController,
    DGet, DHeader,
    DHeaders,
    DRequest,
    DResponse,
} from '../../src';

@DController('/header')
export class HeaderController {
    @DGet('/many')
    async headers(
    @DRequest() req: Request,
        @DResponse() res: Response,
        @DHeaders() headers: Record<string, any>,
    ) {
        send(res, headers);
    }

    @DGet('/single')
    async header(
    @DRequest() req: Request,
        @DResponse() res: Response,
        @DHeader('connection') header: string,
    ) {
        send(res, header);
    }
}
