import { HeaderName } from '../../constants.ts';
import { findRouterOption } from '../../router-options/index.ts';
import type { TrustProxyFn, TrustProxyInput } from '../../utils/index.ts';
import { buildTrustProxyFn } from '../../utils/index.ts';
import type { DispatchEvent } from '../../dispatcher/event/module.ts';

type RequestProtocolOptions = {
    trustProxy?: TrustProxyInput,
    default?: string,
};

export function getRequestProtocol(
    event: DispatchEvent,
    options?: RequestProtocolOptions,
) : string {
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

    // Derive protocol from the request URL scheme
    let protocol : string | undefined = options.default;
    try {
        const url = new URL(event.request.url);
        if (url.protocol === 'https:') {
            protocol = 'https';
        } else if (!protocol) {
            protocol = 'http';
        }
    } catch {
        if (!protocol) {
            protocol = 'http';
        }
    }

    if (!trustProxy('0.0.0.0', 0)) {
        return protocol;
    }

    const header = event.headers.get(HeaderName.X_FORWARDED_PROTO);
    if (!header) {
        return protocol;
    }

    const index = header.indexOf(',');

    const forwarded = index !== -1 ?
        header.substring(0, index).trim().toLowerCase() :
        header.trim().toLowerCase();

    if (forwarded === 'http' || forwarded === 'https') {
        return forwarded;
    }

    return protocol;
}
