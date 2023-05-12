/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Request } from '../../type';
import { useConfig } from '../../config';
import { HeaderName } from '../../constants';
import type { TrustProxyFn, TrustProxyInput } from '../../utils';
import { buildTrustProxyFn } from '../../utils';

type RequestHostNameOptions = {
    trustProxy?: TrustProxyInput
};

export function getRequestHostName(req: Request, options?: RequestHostNameOptions) : string | undefined {
    options = options || {};

    let trustProxy : TrustProxyFn;
    if (typeof options.trustProxy !== 'undefined') {
        trustProxy = buildTrustProxyFn(options.trustProxy);
    } else {
        const config = useConfig();
        trustProxy = config.get('trustProxy');
    }

    let hostname = req.headers[HeaderName.X_FORWARDED_HOST];
    if (!hostname || !req.socket.remoteAddress || !trustProxy(req.socket.remoteAddress, 0)) {
        hostname = req.headers[HeaderName.HOST];
    } else {
        hostname = Array.isArray(hostname) ? hostname.pop() : hostname;
        if (hostname && hostname.indexOf(',') !== -1) {
            hostname = hostname.substring(0, hostname.indexOf(',')).trimEnd();
        }
    }

    if (!hostname) {
        return undefined;
    }

    // IPv6 literal support
    const offset = hostname[0] === '[' ?
        hostname.indexOf(']') + 1 :
        0;
    const index = hostname.indexOf(':', offset);

    return index !== -1 ?
        hostname.substring(0, index) :
        hostname;
}
