import { compile } from 'proxy-addr';
import type { TrustProxyFn } from './type.ts';

export function buildTrustProxyFn(
    input?: boolean | number | string | string[] | TrustProxyFn,
) : TrustProxyFn {
    if (typeof input === 'function') {
        return input;
    }

    if (input === true) {
        return () => true;
    }

    if (typeof input === 'number') {
        return (_address, hop) => hop < (input as number);
    }

    if (typeof input === 'string') {
        input = input.split(',')
            .map((value) => value.trim());
    }

    return compile(input || []);
}

/**
 * Default `TrustProxyFn` used by request helpers when neither the
 * call's `options.trustProxy` nor `event.appOptions.trustProxy` is
 * set. Trusts no addresses — the conservative default.
 *
 * Module-scoped so all helpers share the same reference and we don't
 * allocate per-request.
 */
export const DEFAULT_TRUST_PROXY: TrustProxyFn = buildTrustProxyFn();
