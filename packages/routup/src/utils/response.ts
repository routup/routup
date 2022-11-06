/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Next, Response } from '../type';

/* istanbul ignore next */
export function createResponseTimeout(res: Response, timeout: number, done?: Next) {
    const instance = setTimeout(() => {
        res.statusCode = 504;
        res.statusMessage = 'Gateway Timeout';

        res.end();
    }, timeout);

    res.once('close', () => {
        clearTimeout(instance);

        if (typeof done === 'function') {
            done();
        }
    });

    res.once('error', (e) => {
        clearTimeout(instance);

        if (typeof done === 'function') {
            done(e);
        }
    });
}
