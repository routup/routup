import { HeaderName } from '../../constants.ts';
import { basename } from '../../utils/index.ts';
import type { IAppEvent } from '../../event/index.ts';
import { setResponseHeaderAttachment, setResponseHeaderInline } from './header-disposition.ts';
import { setResponseContentTypeByFileName } from './utils.ts';

export type SendFileContentOptions = {
    end?: number,
    start?: number;
};

/**
 * File metadata used by {@link sendFile}. All fields are optional, but each
 * missing field disables related response features:
 *
 * - `size`  — without it, range requests, `Accept-Ranges`, `Content-Length`,
 *             `ETag`, and `Last-Modified` are all omitted (the response is sent
 *             without HTTP-level caching or seekability).
 * - `mtime` — without it, `Last-Modified` is omitted and the `ETag` is not
 *             emitted (`ETag` requires both `size` and `mtime`).
 * - `name`  — falls back to `SendFileOptions.name` when set; if both are
 *             missing, no `Content-Disposition` or extension-derived
 *             `Content-Type` is set.
 */
export type SendFileStats = {
    size?: number,
    mtime?: Date | number | string,
    name?: string
};

export type SendFileDisposition = 'attachment' | 'inline';

export type SendFileContent = ReadableStream | ArrayBuffer | Uint8Array;
export type SendFileOptions = {
    stats: (() => Promise<SendFileStats> | SendFileStats) | SendFileStats,
    content: (options: SendFileContentOptions) => Promise<SendFileContent> | SendFileContent,
    /**
     * @deprecated Use `disposition: 'attachment'` instead. Kept for backwards
     * compatibility — when `disposition` is set, it takes precedence.
     */
    attachment?: boolean,
    disposition?: SendFileDisposition,
    name?: string
};

export async function sendFile(
    event: IAppEvent,
    options: SendFileOptions,
) : Promise<Response> {
    let stats : SendFileStats;
    if (typeof options.stats === 'function') {
        stats = await options.stats();
    } else {
        stats = options.stats;
    }

    const name = options.name || stats.name;
    const { headers } = event.response;

    const disposition = options.disposition ?? (options.attachment ? 'attachment' : undefined);

    if (name) {
        const fileName = basename(name);

        if (disposition) {
            const dispositionHeader = headers.get(HeaderName.CONTENT_DISPOSITION);
            if (!dispositionHeader) {
                if (disposition === 'inline') {
                    setResponseHeaderInline(event, fileName);
                } else {
                    setResponseHeaderAttachment(event, fileName);
                }
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
                const rangeHeaders = new Headers(headers);
                rangeHeaders.set(HeaderName.CONTENT_RANGE, `bytes */${stats.size}`);
                return new Response(null, {
                    status: 416,
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

    return new Response(content as BodyInit, {
        status: statusCode,
        headers,
    });
}
