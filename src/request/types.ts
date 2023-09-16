import type { IncomingMessage } from 'node:http';
import type { NodeReadableStream, WebReadableStream } from '../types';

export type RequestBody = null | Iterable<any> | AsyncIterable<any> | NodeReadableStream | WebReadableStream;
export type RequestHeaders = Record<string, string | string[]>;

export type RequestCreateContext = {
    body?: RequestBody,
    headers?: RequestHeaders,
    method?: string,
    url?: string
};

export interface Request extends IncomingMessage {

}
