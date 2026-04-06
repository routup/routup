import Negotiator from 'negotiator';

import type { IRoutupEvent } from '../../event/index.ts';

const negotiatorMap = new WeakMap<IRoutupEvent, Negotiator>();

function headersToPlainObject(headers: Headers) : Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
        result[key] = value;
    });
    return result;
}

export function useRequestNegotiator(event: IRoutupEvent) : Negotiator {
    let value = negotiatorMap.get(event);
    if (value) {
        return value;
    }

    value = new Negotiator({ headers: headersToPlainObject(event.headers) });
    negotiatorMap.set(event, value);
    return value;
}
