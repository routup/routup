import type { WebBlob, WebResponse } from '../types';

export function isWebBlob(input: unknown) : input is WebBlob {
    return typeof Blob !== 'undefined' && input instanceof Blob;
}

export function isWebResponse(input: unknown): input is WebResponse {
    return typeof Response !== 'undefined' && input instanceof Response;
}
