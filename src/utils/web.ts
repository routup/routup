export function isWebBlob(input: unknown) : input is Blob {
    return typeof Blob !== 'undefined' && input instanceof Blob;
}

export function isWebResponse(input: unknown): input is Response {
    return typeof Response !== 'undefined' && input instanceof Response;
}
