import { buildEtagFn, buildTrustProxyFn } from '../utils/index.ts';
import type { RouterOptions, RouterOptionsInput } from './types.ts';

export function normalizeRouterOptions(input: RouterOptionsInput): Partial<RouterOptions> {
    if (typeof input.etag !== 'undefined' && input.etag !== null) {
        // Keep `false` (and `null` from already-normalized options being
        // re-spread, e.g. via Router.clone) as the literal `null`
        // sentinel so toResponse() can synchronously skip the ETag path.
        // A truthy no-op fn (the previous behavior) forced an
        // `await applyEtag(...)` microtask hop on every request.
        input.etag = input.etag === false ?
            null :
            buildEtagFn(input.etag);
    }

    if (typeof input.trustProxy !== 'undefined') {
        input.trustProxy = buildTrustProxyFn(input.trustProxy);
    }

    if (typeof input.timeout !== 'undefined') {
        if (
            typeof input.timeout !== 'number' ||
            !Number.isFinite(input.timeout) ||
            input.timeout <= 0
        ) {
            delete input.timeout;
        }
    }

    if (typeof input.handlerTimeout !== 'undefined') {
        if (
            typeof input.handlerTimeout !== 'number' ||
            !Number.isFinite(input.handlerTimeout) ||
            input.handlerTimeout <= 0
        ) {
            delete input.handlerTimeout;
        }
    }

    return input as Partial<RouterOptions>;
}
