import { HeaderName } from '../../constants';
import type { Response } from '../../type';
import { basename } from '../../utils';
import { isResponseGone } from './gone';
import { setResponseHeaderAttachment } from './header-attachment';
import { send } from './send';
import { sendStream } from './send-stream';
import { isStream, setResponseContentTypeByFileName } from './utils';

export type SendFileContentOptions = {
    end?: number,
    start?: number;
};

export type SendFileStats = {
    size?: number,
    mtime?: Date | number | string
};

export type SendFileOptions = {
    getStats: () => Promise<SendFileStats> | SendFileStats,
    getContent: (options: SendFileContentOptions) => Promise<unknown> | unknown
    attachment?: boolean,
    name?: string,
    next?: (err?: Error) => Promise<unknown> | unknown
};

export async function sendFile(
    res: Response,
    options: SendFileOptions,
) {
    let stats: SendFileStats;
    try {
        stats = await options.getStats();
    } catch (e) {
        if (options.next) {
            return options.next(e as Error);
        }

        if (isResponseGone(res)) {
            return Promise.resolve();
        }

        res.statusCode = 400;
        res.end();

        return Promise.reject(e);
    }

    if (options.name) {
        const fileName = basename(options.name);

        if (options.attachment) {
            const dispositionHeader = res.getHeader(HeaderName.CONTENT_DISPOSITION);
            if (!dispositionHeader) {
                setResponseHeaderAttachment(res, fileName);
            }
        } else {
            setResponseContentTypeByFileName(res, fileName);
        }
    }

    const contentOptions : SendFileContentOptions = {};

    if (stats.size) {
        const rangeHeader = res.req.headers[HeaderName.RANGE];
        if (rangeHeader) {
            const [x, y] = rangeHeader.replace('bytes=', '')
                .split('-');

            contentOptions.end = Math.min(
                parseInt(y, 10) || stats.size - 1,
                stats.size - 1,
            );

            contentOptions.start = parseInt(x, 10) || 0;

            if (contentOptions.end >= stats.size) {
                contentOptions.end = stats.size - 1;
            }

            if (contentOptions.start >= stats.size) {
                res.setHeader(HeaderName.CONTENT_RANGE, `bytes */${stats.size}`);
                res.statusCode = 416;
                res.end();
                return Promise.resolve();
            }

            res.setHeader(HeaderName.CONTENT_RANGE, `bytes ${contentOptions.start}-${contentOptions.end}/${stats.size}`);
            res.setHeader(HeaderName.CONTENT_LENGTH, (contentOptions.end - contentOptions.start + 1));
        } else {
            res.setHeader(HeaderName.CONTENT_LENGTH, stats.size);
        }

        res.setHeader(HeaderName.ACCEPT_RANGES, 'bytes');

        if (stats.mtime) {
            const mtime = new Date(stats.mtime);
            res.setHeader(HeaderName.LAST_MODIFIED, mtime.toUTCString());
            res.setHeader(HeaderName.ETag, `W/"${stats.size}-${mtime.getTime()}"`);
        }
    }

    try {
        const content = await options.getContent(contentOptions);
        if (isStream(content)) {
            return await sendStream(res, content, options.next);
        }

        return await send(res, content);
    } catch (e) {
        if (options.next) {
            return options.next(e as Error);
        }

        if (isResponseGone(res)) {
            return Promise.resolve();
        }

        res.statusCode = 400;
        res.end();

        return Promise.reject(e);
    }
}
