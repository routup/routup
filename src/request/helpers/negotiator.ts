import Negotiator from 'negotiator';

import type { IRoutupEvent } from '../../event/index.ts';

const NEGOTIATOR_KEY = /* @__PURE__ */ Symbol.for('routup:negotiator');

function headersToPlainObject(headers: Headers) : Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
        result[key] = value;
    });
    return result;
}

export function useRequestNegotiator(event: IRoutupEvent) : Negotiator {
    let value = event.context[NEGOTIATOR_KEY] as Negotiator | undefined;
    if (value) {
        return value;
    }

    value = new Negotiator({ headers: headersToPlainObject(event.headers) });
    event.context[NEGOTIATOR_KEY] = value;
    return value;
}
