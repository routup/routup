import type { DispatchEvent } from '../../dispatcher/event/module.ts';

const bodyCache = new WeakMap<DispatchEvent, unknown>();

/**
 * Parse and cache the request body based on Content-Type.
 *
 * Calling readBody() multiple times returns the cached result,
 * avoiding "body already consumed" errors.
 */
export async function readBody<T = unknown>(event: DispatchEvent): Promise<T> {
    if (bodyCache.has(event)) {
        return bodyCache.get(event) as T;
    }

    const contentType = event.headers.get('content-type') || '';
    let parsed: unknown;

    if (contentType.includes('application/json')) {
        parsed = await event.request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await event.request.text();
        parsed = Object.fromEntries(new URLSearchParams(text));
    } else if (contentType.includes('multipart/form-data')) {
        parsed = await event.request.formData();
    } else {
        parsed = await event.request.text();
    }

    bodyCache.set(event, parsed);
    return parsed as T;
}

/**
 * Read the raw request body as an ArrayBuffer.
 * Not cached — the caller should manage single-use access.
 */
export async function readRawBody(event: DispatchEvent): Promise<ArrayBuffer> {
    return event.request.arrayBuffer();
}

/**
 * Read the request body as FormData.
 * Not cached — the caller should manage single-use access.
 */
export async function readFormData(event: DispatchEvent): Promise<FormData> {
    return event.request.formData();
}
