import type { NodeRequest } from '../../bridge';
import { useRequestNegotiator } from './negotiator';

export function getRequestAcceptableCharsets(req: NodeRequest) : string[] {
    const negotiator = useRequestNegotiator(req);

    return negotiator.charsets();
}

export function getRequestAcceptableCharset(req: NodeRequest, input: string | string[]) : string | undefined {
    input = input || [];

    const items = Array.isArray(input) ? input : [input];

    if (items.length === 0) {
        return getRequestAcceptableCharsets(req).shift();
    }

    const negotiator = useRequestNegotiator(req);
    return negotiator.charsets(items).shift() || undefined;
}
