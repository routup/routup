import type { DispatchEvent } from '../dispatcher/event/module.ts';

export function toResponse(
    value: unknown,
    event: DispatchEvent,
): Response | undefined {
    if (value === null || value === undefined) {
        return undefined;
    }

    if (value instanceof Response) {
        return value;
    }

    const { status, headers, statusText } = event.response;

    if (typeof value === 'string') {
        if (!headers.has('content-type')) {
            headers.set('content-type', 'text/plain; charset=utf-8');
        }
        return new Response(value, { status, statusText, headers });
    }

    if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
        if (!headers.has('content-type')) {
            headers.set('content-type', 'application/octet-stream');
        }
        return new Response(value, { status, statusText, headers });
    }

    if (value instanceof ReadableStream) {
        return new Response(value, { status, statusText, headers });
    }

    if (value instanceof Blob) {
        if (!headers.has('content-type')) {
            headers.set('content-type', value.type || 'application/octet-stream');
        }
        return new Response(value, { status, statusText, headers });
    }

    // object/array/number/boolean — JSON serialize
    if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json; charset=utf-8');
    }
    return new Response(JSON.stringify(value), { status, statusText, headers });
}
