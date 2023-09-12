import { buildEtagFn, buildTrustProxyFn } from '../utils';
import type { RouterOptions, RouterOptionsInput } from './type';

export function transformRouterOptions(input: RouterOptionsInput): Partial<RouterOptions> {
    if (typeof input.etag !== 'undefined') {
        input.etag = buildEtagFn(input.etag);
    }

    if (typeof input.trustProxy !== 'undefined') {
        input.trustProxy = buildTrustProxyFn(input.trustProxy);
    }

    return input as Partial<RouterOptions>;
}
