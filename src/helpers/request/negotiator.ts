/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncomingMessage } from 'http';
import Negotiator from 'negotiator';

const NegotiatorSymbol = Symbol.for('ReqNegotiator');

export function useRequestNegotiator(req: IncomingMessage) : Negotiator {
    if (NegotiatorSymbol in req) {
        return (req as any)[NegotiatorSymbol];
    }

    return new Negotiator(req);
}
