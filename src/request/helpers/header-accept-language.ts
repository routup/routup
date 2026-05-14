import type { IAppEvent } from '../../event/index.ts';
import { useRequestNegotiator } from './negotiator.ts';

export function getRequestAcceptableLanguages(event: IAppEvent) : string[] {
    const negotiator = useRequestNegotiator(event);
    return negotiator.languages();
}

export function getRequestAcceptableLanguage(event: IAppEvent, input?: string | string[]) : string | undefined {
    input = input || [];

    const items = Array.isArray(input) ? input : [input];

    if (items.length === 0) {
        return getRequestAcceptableLanguages(event).shift();
    }

    const negotiator = useRequestNegotiator(event);
    return negotiator.languages(items).shift() || undefined;
}
