import type { NodeRequest } from '../../type';
import { HeaderName } from '../../constants';
import { getMimeType } from '../../utils';
import { getRequestHeader } from './header';
import { useRequestNegotiator } from './negotiator';

export function getRequestAcceptableContentTypes(req: NodeRequest) : string[] {
    const negotiator = useRequestNegotiator(req);

    return negotiator.mediaTypes();
}

export function getRequestAcceptableContentType(req: NodeRequest, input?: string | string[]) : string | undefined {
    input = input || [];

    const items = Array.isArray(input) ? input : [input];

    if (items.length === 0) {
        return getRequestAcceptableContentTypes(req).shift();
    }

    const header = getRequestHeader(req, HeaderName.ACCEPT);
    if (!header) {
        return items[0];
    }

    let polluted = false;
    const mimeTypes : string[] = [];
    for (let i = 0; i < items.length; i++) {
        const mimeType = getMimeType(items[i]);
        if (mimeType) {
            mimeTypes.push(mimeType);
        } else {
            polluted = true;
        }
    }

    const negotiator = useRequestNegotiator(req);
    const matches = negotiator.mediaTypes(mimeTypes);
    if (matches.length > 0) {
        if (polluted) {
            return items[0];
        }

        return items[mimeTypes.indexOf(matches[0])];
    }

    return undefined;
}
