import Negotiator from 'negotiator';

import type { DispatchEvent } from '../../dispatcher/event/module.ts';

const negotiatorMap = new WeakMap<DispatchEvent, Negotiator>();

function headersToPlainObject(headers: Headers) : Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
        result[key] = value;
    });
    return result;
}

export function useRequestNegotiator(event: DispatchEvent) : Negotiator {
    let value = negotiatorMap.get(event);
    if (value) {
        return value;
    }

    value = new Negotiator({ headers: headersToPlainObject(event.headers) });
    negotiatorMap.set(event, value);
    return value;
}
