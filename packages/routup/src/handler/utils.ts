/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Next, Response, send } from '@routup/core';
import { isPromise } from '../utils';

export function processHandlerExecutionOutput(res: Response, next: Next, output?: unknown) {
    if (isPromise(output)) {
        output
            .then((r) => {
                if (typeof r !== 'undefined') {
                    send(res, r);
                }

                return r;
            })
            .catch(next);
        return;
    }

    if (typeof output !== 'undefined') {
        send(res, output);
    }
}
