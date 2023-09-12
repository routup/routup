import type { NodeRequest } from '../../bridge';
import { HeaderName } from '../../constants';
import { findRouterOption } from '../../router-options';
import type { TrustProxyFn, TrustProxyInput } from '../../utils';
import { buildTrustProxyFn } from '../../utils';
import { useRequestRouterIds } from './router';

type RequestHostNameOptions = {
    trustProxy?: TrustProxyInput
};

export function getRequestHostName(req: NodeRequest, options?: RequestHostNameOptions) : string | undefined {
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
