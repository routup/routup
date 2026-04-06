import type { IRoutupEvent } from '../../event/index.ts';

export type BodyType = 'json' | 'text' | 'urlencoded' | 'formData' | 'arrayBuffer' | 'blob' | 'stream';

export type ReadBodyOptions<T extends BodyType = BodyType> = {
    type?: T;
};

/**
 * Read and parse the request body.
 *
 * When `type` is specified, the body is parsed accordingly.
 * When omitted, the type is auto-detected from the Content-Type header.
 */
export function readBody(event: IRoutupEvent, options: ReadBodyOptions<'text'>): Promise<string>;

export function readBody(event: IRoutupEvent, options: ReadBodyOptions<'arrayBuffer'>): Promise<ArrayBuffer>;

export function readBody(event: IRoutupEvent, options: ReadBodyOptions<'blob'>): Promise<Blob>;

export function readBody(event: IRoutupEvent, options: ReadBodyOptions<'formData'>): Promise<FormData>;

export function readBody(event: IRoutupEvent, options: ReadBodyOptions<'urlencoded'>): Promise<Record<string, unknown>>;

export function readBody(event: IRoutupEvent, options: ReadBodyOptions<'stream'>): ReadableStream | null;

export function readBody<T = unknown>(event: IRoutupEvent, options?: ReadBodyOptions<'json'>): Promise<T>;

export function readBody(event: IRoutupEvent, options?: ReadBodyOptions): Promise<unknown> | ReadableStream | null;

export function readBody(event: IRoutupEvent, options: ReadBodyOptions = {}): Promise<unknown> | ReadableStream | null {
    const type = options.type || detectBodyType(event);

    switch (type) {
        case 'text':
            return event.request.text();
        case 'arrayBuffer':
            return event.request.arrayBuffer();
        case 'blob':
            return event.request.blob();
        case 'formData':
            return event.request.formData();
        case 'urlencoded':
            return event.request.text().then(parseURLEncodedBody);
        case 'stream':
            return event.request.body;
        case 'json':
        default:
            return event.request.json();
    }
}

function detectBodyType(event: IRoutupEvent): BodyType {
    const contentType = event.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        return 'json';
    }

    if (contentType.includes('application/x-www-form-urlencoded')) {
        return 'urlencoded';
    }

    if (contentType.includes('multipart/form-data')) {
        return 'formData';
    }

    if (contentType.includes('application/octet-stream')) {
        return 'arrayBuffer';
    }

    return 'text';
}

function parseURLEncodedBody(body: string): Record<string, unknown> {
    const form = new URLSearchParams(body);
    const parsed: Record<string, unknown> = Object.create(null);

    for (const [key, value] of form.entries()) {
        const existing = parsed[key];
        if (existing !== undefined) {
            if (Array.isArray(existing)) {
                existing.push(value);
            } else {
                parsed[key] = [existing, value];
            }
        } else {
            parsed[key] = value;
        }
    }

    return parsed;
}
