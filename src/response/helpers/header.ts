import { sanitizeHeaderValue } from '../../utils/index.ts';
import type { IRoutupEvent } from '../../event/index.ts';

export function appendResponseHeader(
    event: IRoutupEvent,
    name: string,
    value: string | string[],
) {
    const { headers } = event.response;

    if (Array.isArray(value)) {
        for (const v of value) {
            headers.append(name, sanitizeHeaderValue(v));
        }
    } else {
        headers.append(name, sanitizeHeaderValue(value));
    }
}

export function appendResponseHeaderDirective(
    event: IRoutupEvent,
    name: string,
    value: string | string[],
) {
    const { headers } = event.response;
    const existing = headers.get(name);

    if (!existing) {
        if (Array.isArray(value)) {
            headers.set(name, sanitizeHeaderValue(value.join('; ')));
        } else {
            headers.set(name, sanitizeHeaderValue(value));
        }
        return;
    }

    const directives = existing.split('; ');

    if (Array.isArray(value)) {
        directives.push(...value);
    } else {
        directives.push(value);
    }

    const unique = [...new Set(directives)];

    headers.set(name, sanitizeHeaderValue(unique.join('; ')));
}
