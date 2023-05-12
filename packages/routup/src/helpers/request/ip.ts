/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import proxyAddr from 'proxy-addr';
import type { Request } from '../../type';
import { useConfig } from '../../config';
import type { TrustProxyFn, TrustProxyInput } from '../../utils';
import { buildTrustProxyFn } from '../../utils';

type RequestIpOptions = {
    trustProxy?: TrustProxyInput
};

export function getRequestIP(req: Request, options?: RequestIpOptions) : string {
    options = options || {};

    let trustProxy : TrustProxyFn;
    if (typeof options.trustProxy !== 'undefined') {
        trustProxy = buildTrustProxyFn(options.trustProxy);
    } else {
        const config = useConfig();
        trustProxy = config.get('trustProxy');
    }

    return proxyAddr(req, trustProxy);
}
