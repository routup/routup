import type { IRoutupEvent } from '../../event/index.ts';
import { useRequestNegotiator } from './negotiator.ts';

export function getRequestAcceptableLanguages(event: IRoutupEvent) : string[] {
    const negotiator = useRequestNegotiator(event);
    return negotiator.languages();
}

export function getRequestAcceptableLanguage(event: IRoutupEvent, input?: string | string[]) : string | undefined {
    input = input || [];

    const items = Array.isArray(input) ? input : [input];

    if (items.length === 0) {
        return getRequestAcceptableLanguages(event).shift();
    }

    const negotiator = useRequestNegotiator(event);
    return negotiator.languages(items).shift() || undefined;
}
