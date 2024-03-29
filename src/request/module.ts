import type { IncomingMessage } from 'node:http';
import type { Readable as NodeReadable } from 'node:stream';
import { Readable } from 'readable-stream';
import type { ReadableStream as NodeWebReadableStream } from 'stream/web';
import { isWebStream } from '../utils';
import type { RequestCreateContext } from './types';

export function createRequest(context: RequestCreateContext) : IncomingMessage {
    let readable: NodeReadable;
    if (context.body) {
        if (isWebStream(context.body)) {
            readable = (Readable as unknown as typeof NodeReadable).fromWeb(context.body as NodeWebReadableStream);
        } else {
            readable = (Readable as unknown as typeof NodeReadable).from(context.body);
        }
    } else {
        readable = new Readable();
    }

    const headers : Record<string, string | string[] | undefined> = context.headers || {};

    const rawHeaders : string[] = [];
    let keys = Object.keys(headers);
    for (let i = 0; i < keys.length; i++) {
        const header = headers[keys[i]];
        if (Array.isArray(header)) {
            for (let j = 0; j < header.length; j++) {
                rawHeaders.push(keys[i], header[j]);
            }
        } else if (typeof header === 'string') {
            rawHeaders.push(keys[i], header);
        }
    }

    const headersDistinct : Record<string, string[]> = {};
    keys = Object.keys(headers);
    for (let i = 0; i < keys.length; i++) {
        const header = headers[keys[i]];
        if (Array.isArray(header)) {
            headersDistinct[keys[i]] = header;
        }

        if (typeof header === 'string') {
            headersDistinct[keys[i]] = [header];
        }
    }

    Object.defineProperty(readable, 'connection', {
        get() {
            return {
                remoteAddress: '127.0.0.1',
            };
        },
    });

    Object.defineProperty(readable, 'socket', {
        get() {
            return {
                remoteAddress: '127.0.0.1',
            };
        },
    });

    Object.assign(readable, {
        aborted: false,
        complete: true,
        headers,
        headersDistinct,
        httpVersion: '1.1',
        httpVersionMajor: 1,
        httpVersionMinor: 1,
        method: context.method || 'GET',
        rawHeaders,
        rawTrailers: [],
        trailers: {},
        trailersDistinct: {},
        url: context.url || '/',
        setTimeout(_msecs: number, _callback?: () => void) {
            return this as IncomingMessage;
        },
    } satisfies Omit<IncomingMessage, keyof Readable | 'socket' | 'connection'>);

    return readable as IncomingMessage;
}
