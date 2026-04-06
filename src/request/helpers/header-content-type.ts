import { HeaderName } from '../../constants.ts';
import { getMimeType } from '../../utils/index.ts';
import type { IRoutupEvent } from '../../event/index.ts';
import { getRequestHeader } from './header.ts';

export function matchRequestContentType(event: IRoutupEvent, contentType: string) : boolean {
    const header = getRequestHeader(event, HeaderName.CONTENT_TYPE);
    if (!header) {
        return true;
    }

    return header.split(';')[0]!.trim() === getMimeType(contentType);
}
