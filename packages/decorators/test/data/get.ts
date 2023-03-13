/*
 * Copyright (c) 2023-2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Response, send } from 'routup';
import {
    DController, DGet, DPath, DPaths, DResponse,
} from '../../src';
import { DExample } from '../../src/mixed';

type GetManyResponse = {
    foo: string
};

@DController('/get')
export class GetController {
    @DGet('many')
    @DExample<GetManyResponse>({ foo: 'bar' })
    getMany(
    @DResponse() res: Response,
    ) {
        send(res);
    }

    @DGet(':id')
    get(
    @DResponse() res: Response,
        @DPath('id') foo: string,
    ) {
        send(res, foo);
    }

    @DGet(':id/:foo')
    getNested(
    @DResponse() res: Response,
        @DPaths() foo: {id: string, foo: string},
    ) {
        send(res, foo);
    }
}
