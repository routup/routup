import { createError } from '../error/create.ts';
import type { IRoutupEvent } from '../event/index.ts';

function stripWeakPrefix(etag: string): string {
    return etag.startsWith('W/') ? etag.slice(2) : etag;
}

async function applyEtag(
    body: string,
    event: IRoutupEvent,
    headers: Headers,
): Promise<Response | undefined> {
    const etagFn = event.routerOptions.etag;
    if (!etagFn) return undefined;

    const etag = await etagFn(body);
    if (!etag) return undefined;

    headers.set('etag', etag);

    const ifNoneMatch = event.headers.get('if-none-match');
    if (ifNoneMatch && (ifNoneMatch === '*' || ifNoneMatch.split(',').some((t) => stripWeakPrefix(t.trim()) === stripWeakPrefix(etag)))) {
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
            headers: event.response.headers,
        });
    }

    if (value instanceof Response) {
        return value;
    }

    const {
        status,
        headers,
    } = event.response;

    if (typeof value === 'string') {
        if (!headers.has('content-type')) {
            headers.set('content-type', 'text/plain; charset=utf-8');
        }

        const cached = await applyEtag(value, event, headers);
        if (cached) return cached;

        return new Response(value, {
            status,
            headers,
        });
    }

    if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
        if (!headers.has('content-type')) {
            headers.set('content-type', 'application/octet-stream');
        }
        return new Response(value as BodyInit, {
            status,
            headers,
        });
    }

    if (value instanceof ReadableStream) {
        return new Response(value, {
            status,
            headers,
        });
    }

    if (value instanceof Blob) {
        if (!headers.has('content-type')) {
            headers.set('content-type', value.type || 'application/octet-stream');
        }
        return new Response(value, {
            status,
            headers,
        });
    }

    // object/array/number/boolean — JSON serialize
    if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json; charset=utf-8');
    }

    let json: string;
    try {
        json = JSON.stringify(value);
    } catch (e) {
        throw createError({
            message: 'JSON serialization failed',
            status: 500,
            cause: e,
        });
    }

    const cached = await applyEtag(json, event, headers);
    if (cached) return cached;

    return new Response(json, {
        status,
        headers,
    });
}
