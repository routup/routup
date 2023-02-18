/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Response } from '@routup/core';

export function onResponseFinished(res: Response, cb: CallableFunction) {
    let called : boolean;

    const callCallback = () => {
        if (called) return;

        called = true;

        cb();
    };

    res.on('finish', async () => {
        callCallback();
    });

    res.on('close', async () => {
        callCallback();
    });

    res.on('error', async () => {
        callCallback();
    });
}
