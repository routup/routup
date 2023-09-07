import Negotiator from 'negotiator';
import type { NodeRequest } from '../../type';

const NegotiatorSymbol = Symbol.for('ReqNegotiator');

export function useRequestNegotiator(req: NodeRequest) : Negotiator {
    if (NegotiatorSymbol in req) {
        return (req as any)[NegotiatorSymbol];
    }

    return new Negotiator(req);
}
