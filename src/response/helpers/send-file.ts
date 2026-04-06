import { HeaderName } from '../../constants.ts';
import { basename } from '../../utils/index.ts';
import type { IRoutupEvent } from '../../event/index.ts';
import { setResponseHeaderAttachment } from './header-attachment.ts';
import { setResponseContentTypeByFileName } from './utils.ts';

export type SendFileContentOptions = {
    end?: number,
    start?: number;
};

export type SendFileStats = {
    size?: number,
    mtime?: Date | number | string,
    name?: string
};

export type SendFileOptions = {
    stats: () => Promise<SendFileStats> | SendFileStats,
    content: (
        options: SendFileContentOptions,
    ) => Promise<ReadableStream | ArrayBuffer | Uint8Array> | ReadableStream | ArrayBuffer | Uint8Array,
    attachment?: boolean,
    name?: string
};

export async function sendFile(
    event: IRoutupEvent,
    options: SendFileOptions,
) : Promise<Response> {
    const stats = await options.stats();

    const name = options.name || stats.name;
    const { headers } = event.response;

    if (name) {
        const fileName = basename(name);

        if (options.attachment) {
            const dispositionHeader = headers.get(HeaderName.CONTENT_DISPOSITION);
            if (!dispositionHeader) {
                setResponseHeaderAttachment(event, fileName);
            }
        } else {
            setResponseContentTypeByFileName(event, fileName);
        }
    }

    const contentOptions : SendFileContentOptions = {};
    let statusCode = event.response.status;

    if (stats.size) {
        const rangeHeader = event.headers.get(HeaderName.RANGE);
        if (rangeHeader) {
            const [x, y] = rangeHeader.replace('bytes=', '')
                .split('-') as [string, string];

            const parsedStart = Number.parseInt(x, 10);
            const parsedEnd = Number.parseInt(y, 10);

            contentOptions.start = Number.isFinite(parsedStart) && parsedStart >= 0 ? parsedStart : 0;
            contentOptions.end = Number.isFinite(parsedEnd) && parsedEnd >= 0 ?
                Math.min(parsedEnd, stats.size - 1) :
                stats.size - 1;

            if (
                contentOptions.start >= stats.size ||
                contentOptions.start > contentOptions.end
            ) {
                event.dispatched = true;
                const rangeHeaders = new Headers(headers);
                rangeHeaders.set(HeaderName.CONTENT_RANGE, `bytes */${stats.size}`);
                return new Response(null, {
                    status: 416,
                    statusText: event.response.statusText,
                    headers: rangeHeaders,
                });
            }

            headers.set(HeaderName.CONTENT_RANGE, `bytes ${contentOptions.start}-${contentOptions.end}/${stats.size}`);
            headers.set(HeaderName.CONTENT_LENGTH, `${contentOptions.end - contentOptions.start + 1}`);
            statusCode = 206;
        } else {
            headers.set(HeaderName.CONTENT_LENGTH, `${stats.size}`);
        }

        headers.set(HeaderName.ACCEPT_RANGES, 'bytes');

        if (stats.mtime) {
            const mtime = new Date(stats.mtime);
            headers.set(HeaderName.LAST_MODIFIED, mtime.toUTCString());
            headers.set(HeaderName.ETag, `W/"${stats.size}-${mtime.getTime()}"`);
        }
    }

    const content = await options.content(contentOptions);

    event.dispatched = true;

    return new Response(content as BodyInit, {
        status: statusCode,
        statusText: event.response.statusText,
        headers,
    });
}
