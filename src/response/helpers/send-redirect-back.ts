import { HeaderName } from '../../constants.ts';
import type { IAppEvent } from '../../event/index.ts';
import { getRequestProtocol } from '../../request/helpers/protocol.ts';
import { DEFAULT_TRUST_PROXY } from '../../utils/index.ts';
import { sendRedirect } from './send-redirect.ts';

export type SendRedirectBackOptions = {
    /**
     * Trusted location used when there is no same-origin referer.
     * Never pass user input.
     *
     * @default '/'
     */
    fallback?: string,
    /**
     * @default 302
     */
    status?: number,
    /**
     * Keep the query string of the referer.
     *
     * @default false
     */
    allowQuery?: boolean,
};

/**
 * Proxy-aware request origin (port kept), built like getRequestHostName/getRequestProtocol.
 */
function getRequestOrigin(event: IAppEvent) : string | undefined {
    const trustProxy = event.appOptions.trustProxy ?? DEFAULT_TRUST_PROXY;

    let host = event.headers.get(HeaderName.X_FORWARDED_HOST);

    if (host && event.request.ip && trustProxy(event.request.ip, 0)) {
        const index = host.indexOf(',');

        if (index !== -1) {
            host = host.substring(0, index);
        }

        host = host.trim();
    } else {
        host = event.headers.get(HeaderName.HOST);
    }

    if (!host) {
        return undefined;
    }

    const candidate = `${getRequestProtocol(event)}://${host}`;

    if (!URL.canParse(candidate)) {
        return undefined;
    }

    const url = new URL(candidate);

    // a valid host has neither userinfo, path, query nor fragment
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
        return undefined;
    }

    return url.origin;
}

/**
 * Redirect to the path of the Referer when it is same-origin, else to the fallback.
 * Only the path (and optionally the query) is used, never the absolute URL.
 */
export function sendRedirectBack(event: IAppEvent, options: SendRedirectBackOptions = {}): Response {
    const fallback = options.fallback ?? '/';
    const status = options.status ?? 302;
    let location = fallback;

    const referer = event.headers.get(HeaderName.REFERER);
    const origin = referer && URL.canParse(referer) ? getRequestOrigin(event) : undefined;

    if (referer && origin) {
        const url = new URL(referer);

        if (url.origin === origin) {
            // browsers treat `\` like `/`; collapse leading slashes against protocol-relative URLs
            location = url.pathname.replace(/^[/\\]+/, '/');

            if (options.allowQuery) {
                location += url.search;
            }
        }
    }

    return sendRedirect(event, location, status);
}
