/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import proxyAddr from 'proxy-addr';
import { TrustProxyFn, TrustProxyInput, useConfig } from '../../config';
import { buildConfigTrustProxyOption } from '../../config/utils';
import { Request } from '../../type';

type RequestIpOptions = {
    trustProxy?: TrustProxyInput
};

export function getRequestIp(req: Request, options?: RequestIpOptions) : string {
    options = options || {};

    let trustProxy : TrustProxyFn;
    if (typeof options.trustProxy !== 'undefined') {
        trustProxy = buildConfigTrustProxyOption(options.trustProxy);
    } else {
        const config = useConfig();
        trustProxy = config.get('trustProxy');
    }

    return proxyAddr(req, trustProxy);
}
