/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import etag from 'etag';
import { ServerResponse } from 'http';
import { HeaderName } from '../../constants';
import { appendResponseHeaderDirective } from './header';
import { setResponseHeaderContentType } from './header-content-type';

export function send(res: ServerResponse, chunk?: any) {
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

    let encoding : BufferEncoding | null = null;

    if (typeof chunk === 'string') {
        res.setHeader(HeaderName.CONTENT_ENCODING, 'utf-8');

        appendResponseHeaderDirective(res, HeaderName.CONTENT_TYPE, 'charset=utf-8');

        encoding = 'utf-8';
    }

    // populate Content-Length
    let len;
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

        res.setHeader(HeaderName.CONTENT_LENGTH, len);
    }

    // set etag for buffers > 10kb
    if (
        typeof len !== 'undefined' &&
        len > 10_000
    ) {
        const chunkHash = etag(chunk, {
            weak: true,
        });

        res.setHeader('ETag', chunkHash);

        if (res.req.headers['if-none-match'] === chunkHash) {
            res.statusCode = 304;
        }
    }

    // strip irrelevant headers
    if (res.statusCode === 204 || res.statusCode === 304) {
        res.removeHeader('Content-Type');
        res.removeHeader('Content-Length');
        res.removeHeader('Transfer-Encoding');
        chunk = '';
    }

    // alter headers for 205
    if (res.statusCode === 205) {
        res.setHeader('Content-Length', 0);
        res.removeHeader('Transfer-Encoding');
        chunk = '';
    }

    if (res.req.method === 'HEAD') {
        // skip body for HEAD
        res.end();

        return;
    }

    res.end(chunk, encoding);
}
