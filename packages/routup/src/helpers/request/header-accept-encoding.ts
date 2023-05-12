/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { IncomingMessage } from 'http';
import { useRequestNegotiator } from './negotiator';

export function getRequestAcceptableEncodings(req: IncomingMessage) : string[] {
    const negotiator = useRequestNegotiator(req);
    return negotiator.encodings();
}

export function getRequestAcceptableEncoding(req: IncomingMessage, input: string | string[]) : string | undefined {
    input = input || [];

    const items = Array.isArray(input) ? input : [input];

    if (items.length === 0) {
        return getRequestAcceptableEncodings(req).shift();
    }

    const negotiator = useRequestNegotiator(req);
    return negotiator.encodings(items).shift() || undefined;
}
