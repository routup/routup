import { HeaderName } from '../../constants.ts';
import type { TrustProxyFn, TrustProxyInput } from '../../utils/index.ts';
import { DEFAULT_TRUST_PROXY, buildTrustProxyFn } from '../../utils/index.ts';
import type { IAppEvent } from '../../event/index.ts';

export type RequestProtocolOptions = {
    trustProxy?: TrustProxyInput,
    default?: string,
};

export function getRequestProtocol(
    event: IAppEvent,
    options: RequestProtocolOptions = {},
) : string {
    let trustProxy : TrustProxyFn;
    if (typeof options.trustProxy !== 'undefined') {
        trustProxy = buildTrustProxyFn(options.trustProxy);
    } else {
        trustProxy = event.appOptions.trustProxy ?? DEFAULT_TRUST_PROXY;
    }

    // Derive protocol from the request URL scheme
    let protocol : string;
    try {
        const url = new URL(event.request.url);
        if (url.protocol === 'https:') {
            protocol = 'https';
        } else {
            protocol = 'http';
        }
    } catch {
        protocol = options.default || 'http';
    }

    if (!event.request.ip || !trustProxy(event.request.ip, 0)) {
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
