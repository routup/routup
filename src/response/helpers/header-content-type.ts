import { HeaderName } from '../../constants';
import { getMimeType } from '../../utils';
import type { Response } from '../types';

export function setResponseHeaderContentType(res: Response, input: string, ifNotExists?: boolean) {
    if (ifNotExists) {
        const header = res.getHeader(HeaderName.CONTENT_TYPE);
        if (header) {
            return;
        }
    }

    const contentType = getMimeType(input);
    if (contentType) {
        res.setHeader(HeaderName.CONTENT_TYPE, contentType);
    }
}
