import type { IRoutupEvent } from '../event/index.ts';
import { findRouterOption } from '../router-options/module.ts';

async function applyEtag(
    body: string,
    event: IRoutupEvent,
    headers: Headers,
): Promise<Response | undefined> {
    const etagFn = findRouterOption('etag', event.routerPath);
    if (!etagFn) return undefined;

    const etag = await etagFn(body);
    if (!etag) return undefined;

    headers.set('etag', etag);

    const ifNoneMatch = event.headers.get('if-none-match');
    if (ifNoneMatch && (ifNoneMatch === '*' || ifNoneMatch.split(',').some((t) => t.trim() === etag))) {
        return new Response(null, {
            status: 304,
            headers,
        });
    }

    return undefined;
}

export async function toResponse(
    value: unknown,
    event: IRoutupEvent,
): Promise<Response | undefined> {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return new Response(null, {
            status: event.response.status,
            statusText: event.response.statusText,
            headers: event.response.headers,
        });
    }

    if (value instanceof Response) {
        return value;
    }

    const {
        status,
        headers,
        statusText,
    } = event.response;

    if (typeof value === 'string') {
        if (!headers.has('content-type')) {
            headers.set('content-type', 'text/plain; charset=utf-8');
        }

        const cached = await applyEtag(value, event, headers);
        if (cached) return cached;

        return new Response(value, {
            status,
            statusText,
            headers,
        });
    }

    if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
        if (!headers.has('content-type')) {
            headers.set('content-type', 'application/octet-stream');
        }
        return new Response(value as BodyInit, {
            status,
            statusText,
            headers,
        });
    }

    if (value instanceof ReadableStream) {
        return new Response(value, {
            status,
            statusText,
            headers,
        });
    }

    if (value instanceof Blob) {
        if (!headers.has('content-type')) {
            headers.set('content-type', value.type || 'application/octet-stream');
        }
        return new Response(value, {
            status,
            statusText,
            headers,
        });
    }

    // object/array/number/boolean — JSON serialize
    if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json; charset=utf-8');
    }

    const json = JSON.stringify(value);

    const cached = await applyEtag(json, event, headers);
    if (cached) return cached;

    return new Response(json, {
        status,
        statusText,
        headers,
    });
}
