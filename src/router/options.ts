import { buildEtagFn, buildTrustProxyFn } from '../utils/index.ts';
import type { RouterOptions, RouterOptionsInput } from './types.ts';

export function normalizeRouterOptions(input: RouterOptionsInput): Partial<RouterOptions> {
    if (typeof input.etag !== 'undefined') {
        input.etag = buildEtagFn(input.etag);
    }

    if (typeof input.trustProxy !== 'undefined') {
        input.trustProxy = buildTrustProxyFn(input.trustProxy);
    }

    return input as Partial<RouterOptions>;
}
