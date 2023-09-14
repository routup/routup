import type { RequestBody, RequestHeaders } from '../../../request';

export type RawRequest = {
    method: string;
    path: string;
    headers?: RequestHeaders;
    body?: RequestBody
};

export type RawResponseHeader = string | string[];
export type RawResponseHeaders = Record<string, RawResponseHeader>;

export type RawResponse = {
    status: number;
    statusMessage?: string;
    headers: RawResponseHeaders,
    body?: ArrayBuffer;
};

export type DispatchRawRequestOptions = {
    throwOnError?: boolean
};
