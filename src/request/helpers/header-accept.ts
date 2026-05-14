import { HeaderName } from '../../constants.ts';
import { getMimeType } from '../../utils/index.ts';
import type { IAppEvent } from '../../event/index.ts';
import { getRequestHeader } from './header.ts';
import { useRequestNegotiator } from './negotiator.ts';

export function getRequestAcceptableContentTypes(event: IAppEvent) : string[] {
    const negotiator = useRequestNegotiator(event);

    return negotiator.mediaTypes();
}

export function getRequestAcceptableContentType(event: IAppEvent, input?: string | string[]) : string | undefined {
    input = input || [];

    const items = Array.isArray(input) ? input : [input];

    if (items.length === 0) {
        return getRequestAcceptableContentTypes(event).shift();
    }

    const header = getRequestHeader(event, HeaderName.ACCEPT);
    if (!header) {
        return items[0];
    }

    let polluted = false;
    const mimeTypes : string[] = [];
    for (const item of items) {
        const mimeType = getMimeType(item);
        if (mimeType) {
            mimeTypes.push(mimeType);
        } else {
            polluted = true;
        }
    }

    const negotiator = useRequestNegotiator(event);
    const matches = negotiator.mediaTypes(mimeTypes);
    if (matches.length > 0) {
        if (polluted) {
            return items[0];
        }

        return items[mimeTypes.indexOf(matches[0]!)];
    }

    return undefined;
}
