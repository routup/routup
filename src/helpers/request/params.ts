/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncomingMessage } from 'http';

const ParamsSymbol = Symbol.for('ReqParams');

export function useRequestParams(req: IncomingMessage) : Record<string, any> {
    if ('params' in req) {
        return (req as any).params;
    }

    if (ParamsSymbol in req) {
        return (req as any)[ParamsSymbol];
    }

    return {};
}

export function setRequestParams(req: IncomingMessage, data: Record<string, any>) {
    (req as any)[ParamsSymbol] = data;
}
