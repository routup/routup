import type { DispatchEvent } from '../../dispatcher/event/module.ts';
import { useRequestNegotiator } from './negotiator.ts';

export function getRequestAcceptableCharsets(event: DispatchEvent) : string[] {
    const negotiator = useRequestNegotiator(event);

    return negotiator.charsets();
}

export function getRequestAcceptableCharset(event: DispatchEvent, input: string | string[]) : string | undefined {
    input = input || [];

    const items = Array.isArray(input) ? input : [input];

    if (items.length === 0) {
        return getRequestAcceptableCharsets(event).shift();
    }

    const negotiator = useRequestNegotiator(event);
    return negotiator.charsets(items).shift() || undefined;
}
