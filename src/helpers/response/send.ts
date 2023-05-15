import { useConfig } from '../../config';
import { HeaderName } from '../../constants';
import type { Response } from '../../type';
import { appendResponseHeaderDirective } from './header';
import { setResponseHeaderContentType } from './header-content-type';

export function send(res: Response, chunk?: any) {
    switch (typeof chunk) {
        case 'string': {
            setResponseHeaderContentType(res, 'html', true);
            break;
        }
        case 'boolean':
        case 'number':
        case 'object': {
            if (chunk === null) {
                chunk = '';
            } else if (Buffer.isBuffer(chunk)) {
                setResponseHeaderContentType(res, 'bin', true);
            } else {
                chunk = JSON.stringify(chunk);

                setResponseHeaderContentType(res, 'application/json', true);
            }
            break;
        }
    }

    let encoding : BufferEncoding | undefined;

    if (typeof chunk === 'string') {
        res.setHeader(HeaderName.CONTENT_ENCODING, 'utf-8');

        appendResponseHeaderDirective(res, HeaderName.CONTENT_TYPE, 'charset=utf-8');

        encoding = 'utf-8';
    }

    // populate Content-Length
    let len : number | undefined;
    if (chunk !== undefined) {
        if (Buffer.isBuffer(chunk)) {
            // get length of Buffer
            len = chunk.length;
        } else if (chunk.length < 1000) {
            // just calculate length when no ETag + small chunk
            len = Buffer.byteLength(chunk, encoding);
        } else {
            // convert chunk to Buffer and calculate
            chunk = Buffer.from(chunk, encoding);
            encoding = undefined;
            len = chunk.length;
        }

        res.setHeader(HeaderName.CONTENT_LENGTH, `${len}`);
    }

    const config = useConfig();
    const etagFn = config.get('etag');

    if (
        typeof len !== 'undefined'
    ) {
        const chunkHash = etagFn(chunk, encoding, len);
        if (typeof chunkHash === 'string') {
            res.setHeader(HeaderName.ETag, chunkHash);

            if (res.req.headers[HeaderName.IF_NONE_MATCH] === chunkHash) {
                res.statusCode = 304;
            }
        }
    }

    // strip irrelevant headers
    if (res.statusCode === 204 || res.statusCode === 304) {
        res.removeHeader(HeaderName.CONTENT_TYPE);
        res.removeHeader(HeaderName.CONTENT_LENGTH);
        res.removeHeader(HeaderName.TRANSFER_ENCODING);
        chunk = '';
    }

    // alter headers for 205
    if (res.statusCode === 205) {
        res.setHeader(HeaderName.CONTENT_LENGTH, 0);
        res.removeHeader(HeaderName.TRANSFER_ENCODING);
        chunk = '';
    }

    if (res.req.method === 'HEAD') {
        // skip body for HEAD
        res.end();

        return;
    }

    if (typeof encoding !== 'undefined') {
        res.end(chunk, encoding);
        return;
    }

    res.end(chunk);
}
