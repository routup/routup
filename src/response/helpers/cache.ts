import type { IAppEvent } from '../../event/index.ts';

export type ResponseCacheHeadersOptions = {
    maxAge?: number,
    modifiedTime?: string | Date,
    cacheControls?: string[]
};

export function setResponseCacheHeaders(event: IAppEvent, options?: ResponseCacheHeadersOptions) {
    options = options || {};

    const cacheControls = ['public'].concat(options.cacheControls || []);

    if (options.maxAge !== undefined) {
        cacheControls.push(`max-age=${+options.maxAge}`, `s-maxage=${+options.maxAge}`);
    }

    if (options.modifiedTime) {
        const modifiedTime = typeof options.modifiedTime === 'string' ?
            new Date(options.modifiedTime) :
            options.modifiedTime;

        event.response.headers.set('last-modified', modifiedTime.toUTCString());
    }

    event.response.headers.set('cache-control', cacheControls.join(', '));
}
