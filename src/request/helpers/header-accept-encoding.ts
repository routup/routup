import type { DispatchEvent } from '../../dispatcher/event/module.ts';
import { useRequestNegotiator } from './negotiator.ts';

export function getRequestAcceptableEncodings(event: DispatchEvent) : string[] {
    const negotiator = useRequestNegotiator(event);
    return negotiator.encodings();
}

export function getRequestAcceptableEncoding(event: DispatchEvent, input: string | string[]) : string | undefined {
    input = input || [];

    const items = Array.isArray(input) ? input : [input];

    if (items.length === 0) {
        return getRequestAcceptableEncodings(event).shift();
    }

    const negotiator = useRequestNegotiator(event);
    return negotiator.encodings(items).shift() || undefined;
}
