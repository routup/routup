import type { DispatchEvent } from '../../dispatcher/event/module.ts';
import { useRequestNegotiator } from './negotiator.ts';

export function getRequestAcceptableLanguages(event: DispatchEvent) : string[] {
    const negotiator = useRequestNegotiator(event);
    return negotiator.languages();
}

export function getRequestAcceptableLanguage(event: DispatchEvent, input?: string | string[]) : string | undefined {
    input = input || [];

    const items = Array.isArray(input) ? input : [input];

    if (items.length === 0) {
        return getRequestAcceptableLanguages(event).shift();
    }

    const negotiator = useRequestNegotiator(event);
    return negotiator.languages(items).shift() || undefined;
}
