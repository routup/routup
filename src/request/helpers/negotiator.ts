import Negotiator from 'negotiator';

import type { IAppEvent } from '../../event/index.ts';

const NEGOTIATOR_KEY = Symbol.for('routup:negotiator');

function headersToPlainObject(headers: Headers) : Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
        result[key] = value;
    });
    return result;
}

export function useRequestNegotiator(event: IAppEvent) : Negotiator {
    let value = event.store[NEGOTIATOR_KEY] as Negotiator | undefined;
    if (value) {
        return value;
    }

    value = new Negotiator({ headers: headersToPlainObject(event.headers) });
    event.store[NEGOTIATOR_KEY] = value;
    return value;
}
