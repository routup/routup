/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Request } from '../../type';
import { useRequestNegotiator } from './negotiator';

export function getRequestAcceptableCharsets(req: Request) : string[] {
    const negotiator = useRequestNegotiator(req);

    return negotiator.charsets();
}

export function getRequestAcceptableCharset(req: Request, input: string | string[]) : string | undefined {
    input = input || [];

    const items = Array.isArray(input) ? input : [input];

    if (items.length === 0) {
        return getRequestAcceptableCharsets(req).shift();
    }

    const negotiator = useRequestNegotiator(req);
    return negotiator.charsets(items).shift() || undefined;
}
