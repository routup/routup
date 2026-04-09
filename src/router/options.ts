import { buildEtagFn, buildTrustProxyFn } from '../utils/index.ts';
import type { RouterOptions, RouterOptionsInput } from './types.ts';

export function normalizeRouterOptions(input: RouterOptionsInput): Partial<RouterOptions> {
    if (typeof input.etag !== 'undefined') {
        input.etag = buildEtagFn(input.etag);
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
