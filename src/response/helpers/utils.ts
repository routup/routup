import { HeaderName } from '../../constants';
import type { Response } from '../../types';
import { extname, getCharsetForMimeType, getMimeType } from '../../utils';

export function setResponseContentTypeByFileName(res: Response, fileName: string) {
    const ext = extname(fileName);
    if (ext) {
        let type = getMimeType(ext.substring(1));
        if (type) {
            const charset = getCharsetForMimeType(type);
            if (charset) {
                type += `; charset=${charset}`;
            }
            res.setHeader(HeaderName.CONTENT_TYPE, type);
        }
    }
}
