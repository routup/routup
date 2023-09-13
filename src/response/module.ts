import type { OutgoingHttpHeaders } from 'http';
import type { OutgoingHttpHeader } from 'node:http';
import type { Socket } from 'node:net';
import type { Writable as NodeWritable } from 'node:stream';
import { Buffer } from 'buffer';
import { Writable } from 'readable-stream';
import { hasOwnProperty } from 'smob';
import type { Request, Response } from '../types';

type BufferEncoding =
    | 'ascii'
    | 'utf8'
    | 'utf-8'
    | 'utf16le'
    | 'ucs2'
    | 'ucs-2'
    | 'base64'
    | 'base64url'
    | 'latin1'
    | 'binary'
    | 'hex';

type Callback = (error?: (Error | null)) => void;

export function createResponse(request: Request) : Response {
    let output : Buffer | undefined;
    let encoding : BufferEncoding;

    const write = (chunk: any, chunkEncoding: BufferEncoding, callback?: Callback) => {
        if (typeof chunk !== 'undefined') {
            const chunkEncoded = typeof chunk === 'string' ?
                Buffer.from(chunk, chunkEncoding || encoding || 'utf8') :
                chunk;

            if (typeof output !== 'undefined') {
                output = Buffer.concat([output, chunkEncoded]);
            } else {
                output = chunkEncoded;
            }
        }

        encoding = chunkEncoding;

        if (callback) {
            callback();
        }
    };

    const writable = new Writable({
        decodeStrings: false,
        write(
            chunk: any,
            arg2?: string | Callback,
            arg3?: Callback,
        ) {
            const chunkEncoding = typeof arg2 === 'string' ? encoding : 'utf-8';
            let cb : Callback | undefined;
            if (typeof arg2 === 'function') {
                cb = arg2;
            } else if (typeof arg3 === 'function') {
                cb = arg3;
            }

            write(chunk, chunkEncoding, cb);

            return true;
        },
    }) as NodeWritable;

    Object.defineProperty(writable, 'body', {
        get(): any {
            if (output) {
                const arrayBuffer = new ArrayBuffer(output.length);
                const view = new Uint8Array(arrayBuffer);
                for (let i = 0; i < output.length; ++i) {
                    view[i] = output[i];
                }
                return arrayBuffer;
            }

            return new ArrayBuffer(0);
        },
    });

    const headers : OutgoingHttpHeaders = {};

    Object.assign(writable, {
        req: request,
        chunkedEncoding: false,
        connection: null,
        headersSent: false,
        sendDate: false,
        shouldKeepAlive: false,
        socket: null,
        statusCode: 200,
        statusMessage: '',
        strictContentLength: false,
        useChunkedEncodingByDefault: false,
        finished: false,

        addTrailers(_headers: OutgoingHttpHeaders | ReadonlyArray<[string, string]>): void {
        },
        appendHeader(name: string, value: string | ReadonlyArray<string>): Response {
            name = name.toLowerCase();
            const current = headers[name];
            const all = [
                ...(Array.isArray(current) ? current : [current]),
                ...(Array.isArray(value) ? value : [value]),
            ].filter(Boolean) as string[];
            headers[name] = all.length > 1 ? all : all[0];

            return this as Response;
        },
        assignSocket(_socket: Socket): void {
        },
        detachSocket(_socket: Socket): void {
        },

        flushHeaders(): void {
        },
        getHeader(name: string): number | string | string[] | undefined {
            return headers[name.toLowerCase()];
        },
        getHeaderNames(): string[] {
            return Object.keys(headers);
        },
        getHeaders(): OutgoingHttpHeaders {
            return headers;
        },
        hasHeader(name: string): boolean {
            return hasOwnProperty(headers, name.toLowerCase());
        },
        removeHeader(name: string): void {
            delete headers[name.toLowerCase()];
        },
        setHeader(name: string, value: number | string | string[]): Response {
            headers[name.toLowerCase()] = value;
            return this as Response;
        },
        setTimeout(_msecs: number, _callback: (() => void) | undefined): Response {
            return this as Response;
        },
        writeContinue(_callback: (() => void) | undefined): void {
        },
        writeEarlyHints(_hints: Record<string, string | string[]>, callback: (() => void) | undefined): void {
            if (typeof callback !== 'undefined') {
                callback();
            }
        },
        writeProcessing(): void {
        },
        writeHead(
            statusCode: number,
            arg1?: OutgoingHttpHeaders | OutgoingHttpHeader[] | string,
            arg2?: OutgoingHttpHeaders | OutgoingHttpHeader[],
        ): Response {
            this.statusCode = statusCode;

            if (typeof arg1 === 'string') {
                this.statusMessage = arg1;
                arg1 = undefined;
            }
            const headers = (arg2 || arg1) as OutgoingHttpHeaders[] | OutgoingHttpHeaders;
            if (headers) {
                if (Array.isArray(headers)) {
                    for (let i = 0; i < headers.length; i++) {
                        const keys = Object.keys(headers[i]);
                        for (let j = 0; j < keys.length; j++) {
                            this.setHeader(keys[i], headers[i][keys[j]] as OutgoingHttpHeader);
                        }
                    }
                } else {
                    const keys = Object.keys(headers);
                    for (let i = 0; i < keys.length; i++) {
                        this.setHeader(keys[i], headers[keys[i]] as OutgoingHttpHeader);
                    }
                }
            }

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.headersSent = true;

            return this as Response;
        },
    } satisfies Omit<Response, keyof NodeWritable>);

    return writable as Response;
}
