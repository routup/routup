import type { Readable as NodeReadable } from 'node:stream';
import type { Readable } from 'readable-stream';
import type { ReadableStream as NodeWebReadableStream } from 'stream/web';

export type NodeReadableStream = NodeReadable | Readable;
export type WebReadableStream = ReadableStream | NodeWebReadableStream;
