import type { Readable } from 'node:stream';
import { HeaderName } from '../../constants';
import type { Response } from '../../type';
import {
    extname, getCharsetForMimeType, getMimeType, isObject,
} from '../../utils';

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

export function isNodeStream(input: unknown) : input is Readable {
    return isObject(input) &&
        typeof input.pipe === 'function' &&
        typeof input._read === 'function';
}

export function isWebStream(input: unknown) : input is ReadableStream {
    return isObject(input) && typeof input.pipeTo === 'function';
}

export function isStream(data: any): data is Readable | ReadableStream {
    return isNodeStream(data) || isWebStream(data);
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
