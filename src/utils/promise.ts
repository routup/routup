/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { isObject } from './object';

export function isPromise(p: unknown) : p is Promise<unknown> {
    return isObject(p) &&
        (
            p instanceof Promise ||
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            typeof p.then === 'function'
        );
}
