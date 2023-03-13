/*
 * Copyright (c) 2023-2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Response, send } from 'routup';
import {
    DBody, DController, DPost, DResponse,
} from '../../src';

@DController('/post')
export class PostController {
    @DPost('many')
    postMany(
    @DResponse() res: Response,
        @DBody() body: { foo: string },
    ) {
        send(res, body);
    }

    @DPost('single')
    post(
    @DResponse() res: Response,
        @DBody('foo') foo: string,
    ) {
        send(res, foo);
    }
}
