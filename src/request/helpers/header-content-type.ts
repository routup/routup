import { HeaderName } from '../../constants.ts';
import { getMimeType } from '../../utils/index.ts';
import type { DispatchEvent } from '../../dispatcher/event/module.ts';
import { getRequestHeader } from './header.ts';

export function matchRequestContentType(event: DispatchEvent, contentType: string) : boolean {
    const header = getRequestHeader(event, HeaderName.CONTENT_TYPE);
    if (!header) {
        return true;
    }

    return header.split(';')[0]!.trim() === getMimeType(contentType);
}
