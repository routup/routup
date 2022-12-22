/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    Handler,
    HeaderName,
    sendFile,
    useRequestMountPath,
    useRequestPath, withLeadingSlash,
} from '@routup/core';
import { HandlerOptionsInput } from './type';
import { buildHandlerOptions } from './utils';
import { lookup, scanFiles } from './utils/lookup';

export function createHandler(directory: string, input?: HandlerOptionsInput) : Handler {
    const options = buildHandlerOptions({
        ...(input || {}),
        directoryPath: directory,
    });

    let cacheControl : string | undefined;
    if (typeof options.cacheMaxAge !== 'undefined') {
        cacheControl = `public,max-age=${options.cacheMaxAge}`;

        if (options.cacheImmutable) {
            cacheControl += ',immutable';
        } else if (options.cacheMaxAge === 0) {
            cacheControl += ',must-revalidate';
        }
    }

    scanFiles(options);

    return (req, res, next) => {
        let requestPath = useRequestPath(req);

        const mountPath = useRequestMountPath(req);
        if (requestPath.startsWith(mountPath)) {
            requestPath = requestPath.substring(mountPath.length);
        }

        requestPath = withLeadingSlash(requestPath);

        if (requestPath.indexOf('%') !== -1) {
            try {
                requestPath = decodeURI(requestPath);
            } catch (err) {
                // do nothing :)
            }
        }

        lookup(requestPath, options)
            .then((fileInfo) => {
                if (typeof fileInfo === 'undefined') {
                    if (
                        options.fallthrough &&
                        typeof next !== 'undefined'
                    ) {
                        next();
                    } else {
                        res.statusCode = 404;
                        res.end();
                    }

                    return;
                }

                if (cacheControl) {
                    res.setHeader(HeaderName.CACHE_CONTROL, cacheControl);
                }

                if (
                    req.headers[HeaderName.IF_NONE_MATCH] === `W/"${fileInfo.stats.size}-${fileInfo.stats.mtime.getTime()}"`
                ) {
                    res.writeHead(304);
                    res.end();
                    return;
                }

                sendFile(res, fileInfo, (err: Error | null) => {
                    if (err) {
                        if (
                            options.fallthrough &&
                            typeof next === 'function'
                        ) {
                            next();
                        } else {
                            res.statusCode = 404;
                            res.end();
                        }
                    }

                    // file was sent...
                });
            });
    };
}
