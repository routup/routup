/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncomingMessage } from 'http';
import proxyAddr from 'proxy-addr';
import { useConfig } from '../config';
import { TrustProxyFn, TrustProxyInput } from '../type';
import { buildTrustProxyFn } from '../utils/trust-proxy';

type RequestIpOptions = {
    trustProxy?: TrustProxyInput
};

export function getRequestIp(req: IncomingMessage, options?: RequestIpOptions) : string {
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
