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

/* istanbul ignore next */
export function onResponseFinished(
    res: Response,
    cb: (err?: Error) => void,
) {
    let called : boolean;

    const callCallback = (err?: Error) => {
        if (called) return;

        called = true;

        cb(err);
    };

    res.on('finish', () => {
        callCallback();
    });

    res.on('close', () => {
        callCallback();
    });

    res.on('error', (err) => {
        callCallback(err);
    });
}
