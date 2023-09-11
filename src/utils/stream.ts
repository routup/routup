import type { ReadableStream as WebReadableStream } from 'stream/web';
import type { Readable as NodeReadable } from 'node:stream';
import type { Readable } from 'readable-stream';
import { isObject } from './object';

export function isNodeStream(input: unknown): input is NodeReadable | Readable {
    return isObject(input) &&
        typeof input.pipe === 'function' &&
        typeof input.read === 'function';
}

export function isWebStream(input: unknown): input is ReadableStream | WebReadableStream {
    return isObject(input) && typeof input.pipeTo === 'function';
}

export function isStream(data: any): data is NodeReadable | Readable | ReadableStream | WebReadableStream {
    return isNodeStream(data) || isWebStream(data);
}
