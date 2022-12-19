/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Response } from '../../type';
import { send } from './send';

export function sendCreated(res: Response, chunk?: any) {
    res.statusCode = 201;
    res.statusMessage = 'Created';

    return send(res, chunk);
}
