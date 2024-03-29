import { Buffer } from 'buffer';
import { HeaderName } from '../../constants';
import { findRouterOption } from '../../router-options';
import { useRequestRouterPath } from '../../request';
import { isStream, isWebBlob, isWebResponse } from '../../utils';
import type { Response } from '../types';
import { isResponseGone } from './gone';
import { appendResponseHeaderDirective } from './header';
import { setResponseHeaderContentType } from './header-content-type';
import { sendStream } from './send-stream';
import { sendWebBlob } from './send-web-blob';
import { sendWebResponse } from './send-web-response';

export async function send(res: Response, chunk?: any) : Promise<void> {
    switch (typeof chunk) {
        case 'string': {
            setResponseHeaderContentType(res, 'html', true);
            break;
        }
        case 'boolean':
        case 'number':
        case 'object': {
            if (chunk !== null) {
                if (chunk instanceof Error) {
                    throw chunk;
                }

                if (isStream(chunk)) {
                    await sendStream(res, chunk);
                    return;
                }

                if (isWebBlob(chunk)) {
                    await sendWebBlob(res, chunk);
                    return;
                }

                if (isWebResponse(chunk)) {
                    await sendWebResponse(res, chunk);
                    return;
                }

                if (Buffer.isBuffer(chunk)) {
                    setResponseHeaderContentType(res, 'bin', true);
                } else {
                    chunk = JSON.stringify(chunk);

                    setResponseHeaderContentType(res, 'application/json', true);
                }
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
    if (
        chunk !== undefined &&
        chunk !== null
    ) {
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

    if (typeof len !== 'undefined') {
        const etagFn = findRouterOption(
            'etag',
            useRequestRouterPath(res.req),
        );

        const chunkHash = await etagFn(chunk, encoding, len);
        if (isResponseGone(res)) {
            return;
        }

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
    }

    // alter headers for 205
    if (res.statusCode === 205) {
        res.setHeader(HeaderName.CONTENT_LENGTH, 0);
        res.removeHeader(HeaderName.TRANSFER_ENCODING);
    }

    if (isResponseGone(res)) {
        return;
    }

    if (
        res.req.method === 'HEAD' ||
        res.req.method === 'head'
    ) {
        // skip body for HEAD
        res.end();

        return;
    }

    if (typeof chunk === 'undefined' || chunk === null) {
        res.end();
        return;
    }

    if (typeof encoding !== 'undefined') {
        res.end(chunk, encoding);
        return;
    }

    res.end(chunk);
}
