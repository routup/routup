import type { NodeResponse } from '../../bridge';

export type ResponseCacheHeadersOptions = {
    maxAge?: number,
    modifiedTime?: string | Date,
    cacheControls?: string[]
};

export function setResponseCacheHeaders(res: NodeResponse, options?: ResponseCacheHeadersOptions) {
    options = options || {};

    const cacheControls = ['public'].concat(options.cacheControls || []);

    if (options.maxAge !== undefined) {
        cacheControls.push(`max-age=${+options.maxAge}`, `s-maxage=${+options.maxAge}`);
    }

    if (options.modifiedTime) {
        const modifiedTime = typeof options.modifiedTime === 'string' ?
            new Date(options.modifiedTime) :
            options.modifiedTime;

        res.setHeader('last-modified', modifiedTime.toUTCString());
    }

    res.setHeader('cache-control', cacheControls.join(', '));
}
