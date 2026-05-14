import {
    type EtagFn,
    type TrustProxyFn,
    buildEtagFn,
    buildTrustProxyFn,
} from '../utils/index.ts';
import type { AppOptions, AppOptionsInput } from './types.ts';

export function normalizeAppOptions(input: AppOptionsInput): Partial<AppOptions> {
    let etag : EtagFn | null | undefined;
    if (typeof input.etag !== 'undefined') {
        // Keep `false` (and `null` from already-normalized options being
        // re-spread, e.g. via App.clone) as the literal `null`
        // sentinel so toResponse() can synchronously skip the ETag path.
        // A truthy no-op fn (the previous behavior) forced an
        // `await applyEtag(...)` microtask hop on every request.
        if (input.etag === null || input.etag === false) {
            etag = null;
        } else {
            etag = buildEtagFn(input.etag);
        }
    }

    let trustProxy : TrustProxyFn | undefined;
    if (typeof input.trustProxy !== 'undefined') {
        trustProxy = buildTrustProxyFn(input.trustProxy);
    }

    if (typeof input.timeout !== 'undefined') {
        if (
            !Number.isFinite(input.timeout) ||
            input.timeout <= 0
        ) {
            delete input.timeout;
        }
    }

    if (typeof input.handlerTimeout !== 'undefined') {
        if (
            !Number.isFinite(input.handlerTimeout) ||
            input.handlerTimeout <= 0
        ) {
            delete input.handlerTimeout;
        }
    }

    return {
        ...input,
        etag,
        trustProxy,
    };
}
