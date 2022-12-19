/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncomingHttpHeaders } from 'http';
import { Request } from '../../type';

export function getRequestHeader<K extends keyof IncomingHttpHeaders>(
    req: Request,
    name: K,
) : IncomingHttpHeaders[K] {
    return req.headers[name];
}

export function setRequestHeader<K extends keyof IncomingHttpHeaders>(
    req: Request,
    name: K,
    value: IncomingHttpHeaders[K],
) {
    req.headers[name] = value;
}
