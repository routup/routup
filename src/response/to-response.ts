import { createError } from '../error/create.ts';
import type { IRoutupEvent } from '../event/index.ts';

function stripWeakPrefix(etag: string): string {
    return etag.startsWith('W/') ? etag.slice(2) : etag;
}

/**
 * Compute an ETag and conditionally return a 304, or set the header and
 * return undefined to let the caller emit the full response. Always
 * async because the ETag generator may be async (and typically is, via
 * `uncrypto`).
 */
async function applyEtag(
    body: string,
    event: IRoutupEvent,
    headers: Headers,
): Promise<Response | undefined> {
    // etag === false short-circuit is handled by the caller so this
    // function isn't even invoked on the hot path.
    const etagFn = event.routerOptions.etag;
    if (!etagFn) {
        return undefined;
    }

    const etag = await etagFn(body);
    if (!etag) {
        return undefined;
    }

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

/**
 * Convert a handler's return value into a Web `Response`.
 *
 * Returns synchronously for the common cases (string, JSON object,
 * binary, stream, blob) when ETag generation is disabled. Returns a
 * `Promise` when an ETag must be computed (the generator is async).
 *
 * Callers that want the async return uniformly can `await` the result
 * — `await` on a non-Promise still works but pays a microtask hop.
 * The Router fast path branches on `instanceof Promise` to keep the
 * sync return truly sync.
 */
export function toResponse(
    value: unknown,
    event: IRoutupEvent,
): Response | undefined | Promise<Response | undefined> {
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

        if (event.routerOptions.etag) {
            return applyEtag(value, event, headers).then((cached) => cached ?? new Response(value, {
                status,
                headers,
            }));
        }

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

    if (event.routerOptions.etag) {
        return applyEtag(json, event, headers).then((cached) => cached ?? new Response(json, {
            status,
            headers,
        }));
    }

    return new Response(json, {
        status,
        headers,
    });
}
