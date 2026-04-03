import { HeaderName } from '../../constants.ts';
import { extname, getCharsetForMimeType, getMimeType } from '../../utils/index.ts';
import type { DispatchEvent } from '../../dispatcher/event/module.ts';

export function setResponseContentTypeByFileName(event: DispatchEvent, fileName: string) {
    const ext = extname(fileName);
    if (ext) {
        let type = getMimeType(ext.substring(1));
        if (type) {
            const charset = getCharsetForMimeType(type);
            if (charset) {
                type += `; charset=${charset}`;
            }
            event.response.headers.set(HeaderName.CONTENT_TYPE, type);
        }
    }
}
