import type { NodeRequest } from '../../bridge';
import { HeaderName } from '../../constants';
import { getMimeType } from '../../utils';
import { getRequestHeader } from './header';

export function matchRequestContentType(req: NodeRequest, contentType: string) : boolean {
    const header = getRequestHeader(req, HeaderName.CONTENT_TYPE);
    if (!header) {
        return true;
    }

    /* istanbul ignore next */
    if (Array.isArray(header)) {
        if (header.length === 0) {
            return true;
        }

        return header[0] === getMimeType(contentType);
    }

    return header.split('; ').shift() === getMimeType(contentType);
}
