import Negotiator from 'negotiator';
import { getProperty, setProperty } from '../../utils';

import type { Request } from '../types';

const symbol = Symbol.for('ReqNegotiator');

export function useRequestNegotiator(req: Request) : Negotiator {
    let value = getProperty(req, symbol);
    if (value) {
        return value;
    }

    value = new Negotiator(req);
    setProperty(req, symbol, value);
    return value;
}
