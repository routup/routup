import { all } from 'proxy-addr';
import { findRouterOption } from '../../router-options';
import type { TrustProxyFn, TrustProxyInput } from '../../utils';
import { buildTrustProxyFn } from '../../utils';
import type { Request } from '../types';
import { useRequestRouterPath } from './router';

type RequestIpOptions = {
    trustProxy?: TrustProxyInput
};

export function getRequestIP(req: Request, options?: RequestIpOptions) : string {
    options = options || {};

    let trustProxy : TrustProxyFn;
    if (typeof options.trustProxy !== 'undefined') {
        trustProxy = buildTrustProxyFn(options.trustProxy);
    } else {
        trustProxy = findRouterOption(
            'trustProxy',
            useRequestRouterPath(req),
        );
    }

    const addrs = all(req, trustProxy);
    return addrs[addrs.length - 1];
}
