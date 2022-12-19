/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Response } from '../../type';
import { send } from './send';

export function sendAccepted(res: Response, chunk?: any) {
    res.statusCode = 202;
    res.statusMessage = 'Accepted';

    return send(res, chunk);
}
