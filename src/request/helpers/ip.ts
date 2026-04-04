import { HeaderName } from '../../constants.ts';
import type { DispatchEvent } from '../../dispatcher/event/module.ts';

export type RequestIpOptions = {
    trustProxy?: boolean,
};

export function getRequestIP(event: DispatchEvent, options: RequestIpOptions = {}) : string | undefined {
    // srvx ServerRequest may provide .ip directly
    const request = event.request as { ip?: string };
    if (request.ip) {
        return request.ip;
    }

    // Fall back to x-forwarded-for header if proxy is trusted
    if (options.trustProxy) {
        const forwarded = event.headers.get(HeaderName.X_FORWARDED_FOR);
        if (forwarded) {
            const first = forwarded.split(',')[0];
            if (first) {
                return first.trim();
            }
        }
    }

    return undefined;
}
