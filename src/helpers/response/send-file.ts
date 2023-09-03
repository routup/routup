import type { Stats } from 'node:fs';
import { createReadStream, stat } from 'node:fs';
import { HeaderName } from '../../constants';
import type { Response } from '../../type';
import { basename } from '../../utils';
import { setResponseHeaderAttachment } from './header-attachment';
import { sendStream } from './send-stream';
import { setResponseContentTypeByFileName } from './utils';

type ReadStreamOptions = {
    end?: number,
    start?: number;
};

export type SendFileOptions = {
    stats?: Stats,
    filePath: string,
    attachment?: boolean
};

function resolveStats(
    options: SendFileOptions,
    cb: (err: Error | null, stats: Stats) => void,
) {
    if (options.stats) {
        cb(null, options.stats);
        return;
    }

    stat(options.filePath, (err, stats) => cb(err, stats));
}

export function sendFile(res: Response, filePath: string | SendFileOptions, fn?: CallableFunction) {
    let options : SendFileOptions;

    if (typeof filePath === 'string') {
        options = {
            filePath,
        };
    } else {
        options = filePath;
    }

    const fileName = basename(options.filePath);

    if (options.attachment) {
        const dispositionHeader = res.getHeader(HeaderName.CONTENT_DISPOSITION);
        if (!dispositionHeader) {
            setResponseHeaderAttachment(res, fileName);
        }
    } else {
        setResponseContentTypeByFileName(res, fileName);
    }

    resolveStats(options, (err, stats) => {
        /* istanbul ignore next */
        if (err) {
            if (typeof fn === 'function') {
                fn(err);
            } else {
                res.statusCode = 404;
                res.end();
            }

            return;
        }

        const streamOptions : ReadStreamOptions = {};

        const rangeHeader = res.req.headers[HeaderName.RANGE];
        if (rangeHeader) {
            const [x, y] = rangeHeader.replace('bytes=', '')
                .split('-');

            streamOptions.end = Math.min(
                parseInt(y, 10) || stats.size - 1,
                stats.size - 1,
            );

            streamOptions.start = parseInt(x, 10) || 0;

            if (streamOptions.end >= stats.size) {
                streamOptions.end = stats.size - 1;
            }

            if (streamOptions.start >= stats.size) {
                res.setHeader(HeaderName.CONTENT_RANGE, `bytes */${stats.size}`);
                res.statusCode = 416;
                res.end();
                return;
            }

            res.setHeader(HeaderName.CONTENT_RANGE, `bytes ${streamOptions.start}-${streamOptions.end}/${stats.size}`);
            res.setHeader(HeaderName.CONTENT_LENGTH, (streamOptions.end - streamOptions.start + 1));
        } else {
            res.setHeader(HeaderName.CONTENT_LENGTH, stats.size);
        }

        res.setHeader(HeaderName.ACCEPT_RANGES, 'bytes');
        res.setHeader(HeaderName.LAST_MODIFIED, stats.mtime.toUTCString());
        res.setHeader(HeaderName.ETag, `W/"${stats.size}-${stats.mtime.getTime()}"`);

        sendStream(res, createReadStream(options.filePath, streamOptions), fn);
    });
}
