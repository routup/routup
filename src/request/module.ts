import type { IncomingMessage } from 'node:http';
import type { Readable as NodeReadable } from 'node:stream';
import { Readable } from 'readable-stream';
import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
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
    for (const key of keys) {
        const header = headers[key];
        if (Array.isArray(header)) {
            for (const element of header) {
                rawHeaders.push(key, element);
            }
        } else if (typeof header === 'string') {
            rawHeaders.push(key, header);
        }
    }

    const headersDistinct : Record<string, string[]> = {};
    keys = Object.keys(headers);
    for (const key of keys) {
        const header = headers[key];
        if (Array.isArray(header)) {
            headersDistinct[key] = header;
        }

        if (typeof header === 'string') {
            headersDistinct[key] = [header];
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
