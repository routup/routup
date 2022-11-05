/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncomingHttpHeaders, IncomingMessage } from 'http';

export function getRequestHeader<K extends keyof IncomingHttpHeaders>(
    req: IncomingMessage,
    name: K,
) : IncomingHttpHeaders[K] {
    return req.headers[name];
}

export function setRequestHeader<K extends keyof IncomingHttpHeaders>(
    req: IncomingMessage,
    name: K,
    value: IncomingHttpHeaders[K],
) {
    req.headers[name] = value;
}
