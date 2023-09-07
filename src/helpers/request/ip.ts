import { all } from 'proxy-addr';
import { useConfig } from '../../config';
import type { NodeRequest } from '../../type';
import type { TrustProxyFn, TrustProxyInput } from '../../utils';
import { buildTrustProxyFn } from '../../utils';

type RequestIpOptions = {
    trustProxy?: TrustProxyInput
};

export function getRequestIP(req: NodeRequest, options?: RequestIpOptions) : string {
    options = options || {};

    let trustProxy : TrustProxyFn;
    if (typeof options.trustProxy !== 'undefined') {
        trustProxy = buildTrustProxyFn(options.trustProxy);
    } else {
        const config = useConfig();
        trustProxy = config.get('trustProxy');
    }

    const addrs = all(req, trustProxy);
    return addrs[addrs.length - 1];
}
