/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { hasOwnProperty } from 'smob';
import { useConfig } from '../../config';
import { HeaderName } from '../../constants';
import { Request } from '../../type';
import { TrustProxyFn, TrustProxyInput, buildTrustProxyFn } from '../../utils';

type RequestProtocolOptions = {
    trustProxy?: TrustProxyInput,
    default?: string
};

export function getRequestProtocol(req: Request, options?: RequestProtocolOptions) {
    options = options || {};

    let trustProxy : TrustProxyFn;
    if (typeof options.trustProxy !== 'undefined') {
        trustProxy = buildTrustProxyFn(options.trustProxy);
    } else {
        const config = useConfig();
        trustProxy = config.get('trustProxy');
    }

    let protocol : string | undefined = options.default;
    /* istanbul ignore next */
    if (
        hasOwnProperty(req.socket, 'encrypted') &&
        !!req.socket.encrypted
    ) {
        protocol = 'https';
    } else if (!protocol) {
        protocol = 'http';
    }

    if (!req.socket.remoteAddress || !trustProxy(req.socket.remoteAddress, 0)) {
        return protocol;
    }

    let header = req.headers[HeaderName.X_FORWARDED_PROTO];
    /* istanbul ignore next */
    if (Array.isArray(header)) {
        header = header.pop();
    }

    if (!header) {
        return protocol;
    }

    const index = header.indexOf(',');

    return index !== -1 ?
        header.substring(0, index).trim() :
        header.trim();
}
