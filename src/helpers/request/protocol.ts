import { hasOwnProperty } from 'smob';
import type { NodeRequest } from '../../bridge';
import { HeaderName } from '../../constants';
import { findRouterOption } from '../../router-options';
import type { TrustProxyFn, TrustProxyInput } from '../../utils';
import { buildTrustProxyFn } from '../../utils';
import { useRequestRouterIds } from './router';

type RequestProtocolOptions = {
    trustProxy?: TrustProxyInput,
    default?: string
};

export function getRequestProtocol(
    req: NodeRequest,
    options?: RequestProtocolOptions,
) : string {
    options = options || {};

    let trustProxy : TrustProxyFn;
    if (typeof options.trustProxy !== 'undefined') {
        trustProxy = buildTrustProxyFn(options.trustProxy);
    } else {
        trustProxy = findRouterOption(
            'trustProxy',
            useRequestRouterIds(req),
        );
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
