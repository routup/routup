import type { IAppEvent } from '../../event/index.ts';
import { useRequestNegotiator } from './negotiator.ts';

export function getRequestAcceptableEncodings(event: IAppEvent) : string[] {
    const negotiator = useRequestNegotiator(event);
    return negotiator.encodings();
}

export function getRequestAcceptableEncoding(event: IAppEvent, input: string | string[]) : string | undefined {
    input = input || [];

    const items = Array.isArray(input) ? input : [input];

    if (items.length === 0) {
        return getRequestAcceptableEncodings(event).shift();
    }

    const negotiator = useRequestNegotiator(event);
    return negotiator.encodings(items).shift() || undefined;
}
