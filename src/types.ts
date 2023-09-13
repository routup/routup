import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Readable as NodeReadable } from 'node:stream';
import type { Readable } from 'readable-stream';
import type { ReadableStream } from 'stream/web';

export type NodeReadableStream = NodeReadable | Readable;

export type WebReadableStream = globalThis.ReadableStream | ReadableStream;
export type WebResponse = globalThis.Response;
export type WebRequest = globalThis.Request;
export type WebBlob = globalThis.Blob;

export interface Response extends ServerResponse {

}

export interface Request extends IncomingMessage {

}

export type Next = (err?: Error) => void;

export type Handler = (
    req: Request,
    res: Response,
    next: Next
) => unknown | Promise<unknown>;

export type ErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: Next
) => unknown | Promise<unknown>;
