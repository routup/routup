import { HeaderName } from '../../constants.ts';
import type { IRoutupEvent } from '../../event/index.ts';

export type RequestIpOptions = {
    trustProxy?: boolean,
};

export function getRequestIP(event: IRoutupEvent, options: RequestIpOptions = {}) : string | undefined {
    // When proxy is trusted, prefer x-forwarded-for header
    if (options.trustProxy) {
        const forwarded = event.headers.get(HeaderName.X_FORWARDED_FOR);
        if (forwarded) {
            const first = forwarded.split(',')[0];
            if (first) {
                return first.trim();
            }
        }
    }

    // Fall back to srvx ServerRequest .ip (direct connection IP)
    const request = event.request as { ip?: string };
    if (request.ip) {
        return request.ip;
    }

    return undefined;
}
