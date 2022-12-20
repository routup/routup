/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { createReadStream, stat } from 'fs';
import path from 'path';
import { HeaderName } from '../../constants';
import { Response } from '../../type';
import { setResponseHeaderAttachment } from './header-attachment';
import { sendStream } from './send-stream';

type ReadStreamOptions = {
    end?: number,

    start?: number | undefined;
};

export function sendFile(res: Response, filePath: string, fn?: CallableFunction) {
    const dispositionHeader = res.getHeader(HeaderName.CONTENT_DISPOSITION);
    if (!dispositionHeader) {
        setResponseHeaderAttachment(res, path.basename(filePath));
    }

    const rangeHeader = res.req.headers[HeaderName.RANGE];
    if (rangeHeader) {
        stat(filePath, (err, stats) => {
            if (err) {
                if (typeof fn === 'function') {
                    fn(err);
                } else {
                    res.statusCode = 400;
                    res.end();
                }

                return;
            }

            const [x, y] = rangeHeader.replace('bytes=', '')
                .split('-');

            const options : ReadStreamOptions = {};

            options.end = Math.min(
                parseInt(y, 10) || stats.size - 1,
                stats.size - 1,
            );

            options.start = parseInt(x, 10) || 0;

            if (options.start >= stats.size || options.end >= stats.size) {
                res.setHeader(HeaderName.CONTENT_RANGE, `bytes */${stats.size}`);
                res.statusCode = 416;
                res.end();
                return;
            }

            res.setHeader(HeaderName.CONTENT_RANGE, `bytes ${options.start}-${options.end}/${stats.size}`);
            res.setHeader(HeaderName.CONTENT_LENGTH, (options.end - options.start + 1));
            res.setHeader(HeaderName.ACCEPT_RANGES, 'bytes');

            sendStream(res, createReadStream(filePath, options), fn);
        });

        return;
    }

    sendStream(res, createReadStream(filePath), fn);
}
