import Negotiator from 'negotiator';
import type { Request } from '../../type';

const NegotiatorSymbol = Symbol.for('ReqNegotiator');

export function useRequestNegotiator(req: Request) : Negotiator {
    if (NegotiatorSymbol in req) {
        return (req as any)[NegotiatorSymbol];
    }

    return new Negotiator(req);
}
