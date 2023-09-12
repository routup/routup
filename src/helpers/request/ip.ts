import { all } from 'proxy-addr';
import type { NodeRequest } from '../../bridge';
import { findRouterOption } from '../../router-options';
import type { TrustProxyFn, TrustProxyInput } from '../../utils';
import { buildTrustProxyFn } from '../../utils';
import { useRequestRouterIds } from './router';

type RequestIpOptions = {
    trustProxy?: TrustProxyInput
};

export function getRequestIP(req: NodeRequest, options?: RequestIpOptions) : string {
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

    const addrs = all(req, trustProxy);
    return addrs[addrs.length - 1];
}
