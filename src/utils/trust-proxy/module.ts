import { compile } from 'proxy-addr';
import type { TrustProxyFn } from './type';

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
