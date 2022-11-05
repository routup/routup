/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import { IncomingMessage } from 'http';

const BodySymbol = Symbol.for('ReqBody');

export function useRequestBody(req: IncomingMessage) : unknown | undefined {
    if ('body' in req) {
        return (req as any).body;
    }

    if (BodySymbol in req) {
        return (req as any)[BodySymbol];
    }

    return undefined;
}

export function setRequestBody(req: IncomingMessage, body: unknown) {
    (req as any)[BodySymbol] = body;
}
