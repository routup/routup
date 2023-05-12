/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { GatewayTimeoutErrorOptions } from '@ebec/http';
import type { Next, Response } from '../type';

/* istanbul ignore next */
export function createRequestTimeout(res: Response, timeout: number, done?: Next) {
    const instance = setTimeout(() => {
        res.statusCode = GatewayTimeoutErrorOptions.statusCode;
        res.statusMessage = GatewayTimeoutErrorOptions.message;

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
