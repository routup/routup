import { hasOwnProperty } from 'smob';
import type { NodeRequest } from '../../bridge';
import { useConfig } from '../../config';
import { HeaderName } from '../../constants';
import type { TrustProxyFn, TrustProxyInput } from '../../utils';
import { buildTrustProxyFn } from '../../utils';

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
