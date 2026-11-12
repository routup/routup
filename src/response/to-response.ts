import { createError } from '../error/create.ts';
import type { IAppEvent } from '../event/index.ts';
import { matchesETagList } from '../utils/conditional.ts';
import { DEFAULT_ETAG_FN } from '../utils/etag/utils.ts';
import type { EtagFn } from '../utils/etag/types.ts';
import { createFastResponse } from '../utils/response.ts';

/**
 * Build the final `Response` from the accumulated status and headers.
 *
 * Uses srvx's `FastResponse` (via `createFastResponse()`): on Node.js the adapter writes its body
 * and headers straight to the socket instead of materializing a Web
 * `Response` and draining it as a stream; on every other runtime it is
 * the global `Response`.
 *
 * `FastResponse` keeps its init by reference until it is sent, so the
 * headers are copied here. The response must be a snapshot — a
 * middleware touching `event.response.headers` after `event.next()`
 * resolved must not rewrite a response that was already built. Binary
 * bodies are snapshotted the same way by `toResponse()`, so a handler
 * reusing its buffer cannot change what the client receives.
 */
function createResponse(
    body: BodyInit | null,
    status: number,
    headers: Headers,
): Response {
    return createFastResponse(body, status, [...headers]);
}

/**
 * Resolve the effective etag fn for this request. `null` means the
 * user explicitly disabled ETag; `undefined` means the option was
 * never set, and we apply the framework default. Anything else is the
 * user's own fn.
 */
function effectiveEtagFn(event: IAppEvent): EtagFn | null {
    const opt = event.appOptions.etag;

    if (opt === null) {
        return null;
    }

    if (typeof opt === 'undefined') {
        return DEFAULT_ETAG_FN;
    }

    return opt;
}

/**
 * Compute an ETag and conditionally return a 304, or set the header and
 * return undefined to let the caller emit the full response. Always
 * async because the ETag generator may be async (and typically is, via
 * `uncrypto`).
 */
async function applyEtag(
    body: string,
    event: IAppEvent,
    headers: Headers,
): Promise<Response | undefined> {
    // The `null` short-circuit is handled by the caller so this
    // function isn't even invoked on the hot path.
    const etagFn = effectiveEtagFn(event);

    if (!etagFn) {
        return undefined;
    }

    const etag = await etagFn(body);

    if (!etag) {
        return undefined;
    }

    headers.set('etag', etag);

    if (matchesETagList(event.headers.get('if-none-match'), etag)) {
        return createResponse(null, 304, headers);
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
 * The App fast path branches on `instanceof Promise` to keep the
 * sync return truly sync.
 */
export function toResponse(
    value: unknown,
    event: IAppEvent,
): Response | undefined | Promise<Response | undefined> {
    // Cheap nullish checks first.
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return createResponse(null, event.response.status, event.response.headers);
    }

    // typeof gate avoids running `instanceof` against every Web
    // class for the common JSON-object case. Strings and primitives
    // (number/boolean) take their dedicated branches; objects fall
    // through to a single `instanceof Response` check + JSON.
    const t = typeof value;

    if (t === 'string') {
        const { status, headers } = event.response;

        if (!headers.has('content-type')) {
            headers.set('content-type', 'text/plain; charset=utf-8');
        }

        // null is "explicitly disabled"; undefined falls back to the
        // default fn. Either truthy fn or undefined → run applyEtag.
        if (event.appOptions.etag !== null) {
            return applyEtag(value as string, event, headers)
                .then((cached) => cached ?? createResponse(value as string, status, headers));
        }

        return createResponse(value as string, status, headers);
    }

    if (
        t === 'object' &&
        !Array.isArray(value)
    ) {
        // The handler's return value is structurally an object.
        // Order checks by frequency: Response > JSON object > rare
        // binary types. The hot path (JSON object) takes exactly
        // one `instanceof Response` check before reaching the JSON
        // serializer.
        if (value instanceof Response) {
            return value;
        }

        const { status, headers } = event.response;

        // Binary / streaming bodies. Each branch is a single
        // instanceof + dedicated Response construction.
        if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
            if (!headers.has('content-type')) {
                headers.set('content-type', 'application/octet-stream');
            }

            // Copy: `new Uint8Array(view)` takes exactly the view's
            // bytes, not the whole backing buffer.
            const body = value instanceof ArrayBuffer ?
                value.slice(0) :
                new Uint8Array(value);

            return createResponse(body, status, headers);
        }

        if (value instanceof ReadableStream) {
            return createResponse(value, status, headers);
        }

        if (value instanceof Blob) {
            if (!headers.has('content-type')) {
                headers.set('content-type', value.type || 'application/octet-stream');
            }

            return createResponse(value, status, headers);
        }
    }

    const { status, headers } = event.response;

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

    if (event.appOptions.etag !== null) {
        return applyEtag(json, event, headers)
            .then((cached) => cached ?? createResponse(json, status, headers));
    }

    return createResponse(json, status, headers);
}
