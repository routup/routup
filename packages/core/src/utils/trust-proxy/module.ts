/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import proxyAddr from 'proxy-addr';
import { TrustProxyFn } from './type';

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
        return (address, hop) => hop < (input as number);
    }

    if (typeof input === 'string') {
        input = input.split(',')
            .map((value) => value.trim());
    }

    return proxyAddr.compile(input || []);
}
