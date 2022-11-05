/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { ServerResponse } from 'http';
import { Readable } from 'stream';
import { Next } from '../../type';

export function sendStream(res: ServerResponse, stream: Readable, fn?: Next) {
    stream.on('open', () => {
        stream.pipe(res);
    });

    stream.on('error', (err) => {
        if (typeof fn === 'function') {
            fn(err);
        } else {
            res.statusCode = 500;
            res.end();
        }
    });

    stream.on('close', () => {
        if (typeof fn === 'function') {
            fn();
        } else {
            res.end();
        }
    });
}
