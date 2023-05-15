import type { Request } from '../../type';
import { useRequestNegotiator } from './negotiator';

export function getRequestAcceptableLanguages(req: Request) : string[] {
    const negotiator = useRequestNegotiator(req);
    return negotiator.languages();
}

export function getRequestAcceptableLanguage(req: Request, input?: string | string[]) : string | undefined {
    input = input || [];

    const items = Array.isArray(input) ? input : [input];

    if (items.length === 0) {
        return getRequestAcceptableLanguages(req).shift();
    }

    const negotiator = useRequestNegotiator(req);
    return negotiator.languages(items).shift() || undefined;
}
