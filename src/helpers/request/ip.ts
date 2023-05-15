import proxyAddr from 'proxy-addr';
import type { Request } from '../../type';
import { useConfig } from '../../config';
import type { TrustProxyFn, TrustProxyInput } from '../../utils';
import { buildTrustProxyFn } from '../../utils';

type RequestIpOptions = {
    trustProxy?: TrustProxyInput
};

export function getRequestIP(req: Request, options?: RequestIpOptions) : string {
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
