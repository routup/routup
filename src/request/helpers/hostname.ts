import { HeaderName } from '../../constants.ts';
import { findRouterOption } from '../../router-options/index.ts';
import type { TrustProxyFn, TrustProxyInput } from '../../utils/index.ts';
import { buildTrustProxyFn } from '../../utils/index.ts';
import type { DispatchEvent } from '../../dispatcher/event/module.ts';

type RequestHostNameOptions = {
    trustProxy?: TrustProxyInput,
};

export function getRequestHostName(event: DispatchEvent, options?: RequestHostNameOptions) : string | undefined {
    options = options || {};

    let trustProxy : TrustProxyFn;
    if (typeof options.trustProxy !== 'undefined') {
        trustProxy = buildTrustProxyFn(options.trustProxy);
    } else {
        trustProxy = findRouterOption(
            'trustProxy',
            event.routerPath,
        );
    }

    let hostname = event.headers.get(HeaderName.X_FORWARDED_HOST);
    if (!hostname || !trustProxy('0.0.0.0', 0)) {
        hostname = event.headers.get(HeaderName.HOST);
    } else if (hostname && hostname.includes(',')) {
        hostname = hostname.substring(0, hostname.indexOf(',')).trimEnd();
    }

    if (!hostname) {
        return undefined;
    }

    // IPv6 literal support
    const offset = hostname[0] === '[' ?
        hostname.indexOf(']') + 1 :
        0;
    const index = hostname.indexOf(':', offset);

    const result = index !== -1 ?
        hostname.substring(0, index) :
        hostname;

    // Reject hostnames with obviously invalid characters
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1F\x7F\s/@\\]/.test(result)) {
        return undefined;
    }

    return result;
}
