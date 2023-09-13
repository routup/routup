import type { NodeReadableStream, WebReadableStream } from '../../types';

export type RawRequest = {
    method: string;
    path: string;
    headers?: HeadersInit;
    body?: null | Iterable<any> | AsyncIterable<any> | NodeReadableStream | WebReadableStream,
};

export type RawResponseHeader = number | string | string[] | undefined;

export type RawResponse = {
    status: number;
    statusMessage?: string;
    headers: Record<string, RawResponseHeader>
    body?: ArrayBuffer;
};

export type DispatchRawRequestOptions = {
    throwOnError?: boolean
};
