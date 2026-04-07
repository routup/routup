import { HeaderName } from '../../constants.ts';
import type { IRoutupEvent } from '../../event/index.ts';
import { getRouterOption } from '../../helpers/get-router-option.ts';
import type { TrustProxyFn, TrustProxyInput } from '../../utils/index.ts';
import { buildTrustProxyFn } from '../../utils/index.ts';

export type RequestIpOptions = {
    trustProxy?: TrustProxyInput,
};

/**
 * Get the client IP address from the request.
 *
 * When `trustProxy` is configured, walks the `X-Forwarded-For` chain
 * and returns the rightmost untrusted address (the actual client IP).
 * Falls back to `event.request.ip` (the direct connection IP).
 */
export function getRequestIP(event: IRoutupEvent, options: RequestIpOptions = {}) : string | undefined {
    let trustProxy : TrustProxyFn;
    if (typeof options.trustProxy !== 'undefined') {
        trustProxy = buildTrustProxyFn(options.trustProxy);
    } else {
        trustProxy = getRouterOption(event, 'trustProxy');
    }

    const socketAddr = event.request.ip;
    if (!socketAddr) {
        return undefined;
    }

    // Build address list: [socket IP, ...forwarded addresses (rightmost first)]
    const forwarded = event.headers.get(HeaderName.X_FORWARDED_FOR);
    const addrs: string[] = [socketAddr];

    if (forwarded) {
        const parts = forwarded.split(',');
        for (let i = parts.length - 1; i >= 0; i--) {
            const addr = parts[i]!.trim();
            if (addr) {
                addrs.push(addr);
            }
        }
    }

    // Walk from socket (leftmost) to client (rightmost),
    // stopping at the first untrusted address
    for (let i = 0; i < addrs.length - 1; i++) {
        if (!trustProxy(addrs[i]!, i)) {
            return addrs[i];
        }
    }

    // All proxies trusted — return the original client (last in chain)
    return addrs[addrs.length - 1];
}
