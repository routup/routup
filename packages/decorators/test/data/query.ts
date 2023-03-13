/*
 * Copyright (c) 2023-2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    Response, send,
} from 'routup';
import {
    DController, DGet, DQuery, DResponse,
} from '../../src';

@DController('/query')
export class QueryController {
    @DGet('many')
    getMany(
    @DResponse() res: Response,
        @DQuery() query: Record<string, any>,
    ) {
        send(res, query);
    }

    @DGet('single')
    get(
    @DResponse() res: Response,
        @DQuery('foo') foo: string,
    ) {
        send(res, foo);
    }
}
