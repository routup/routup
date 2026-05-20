import { create, parse } from 'content-disposition';
import { HeaderName } from '../../constants.ts';
import { AppError } from '../../error/index.ts';
import type { IAppEvent } from '../../event/index.ts';
import { setResponseContentTypeByFileName } from './utils.ts';

export type ContentDispositionType = 'attachment' | 'inline' | (string & {});

export type ContentDisposition = {
    type: string;
    parameters: Record<string, string>;
};

export type ContentDispositionCreateOptions = {
    /**
     * The disposition type to emit. Defaults to `'attachment'`.
     * Common HTTP response values are `'attachment'` and `'inline'`,
     * but any token (e.g. `'form-data'` for multipart bodies) is accepted.
     */
    type?: ContentDispositionType;
    /**
     * Fallback filename for the legacy `filename` parameter when the input
     * contains non-US-ASCII characters (an RFC 5987 `filename*` is always
     * emitted alongside it).
     *
     * - `true` (default): auto-generate by replacing non-ASCII with `?`.
     * - `false`: omit the legacy fallback (`filename*` only).
     * - `string`: use the provided value verbatim.
     */
    fallback?: string | boolean;
};

export type ContentDispositionParseOptions = {
    /**
     * Decode RFC 5987 / RFC 8187 percent-encoded extended parameters
     * (e.g. `filename*=UTF-8''...`). Defaults to `true`.
     */
    extended?: boolean;
    /**
     * Parse parameters using the relaxed grammar browsers send in
     * `multipart/form-data` bodies. Defaults to `false`.
     */
    multipart?: boolean;
};

export function createContentDisposition(
    filename?: string,
    options?: ContentDispositionCreateOptions,
): string {
    return create(filename, options);
}

export function parseContentDisposition(
    header: string,
    options?: ContentDispositionParseOptions,
): ContentDisposition;
export function parseContentDisposition(
    header: string | null | undefined,
    options?: ContentDispositionParseOptions,
): ContentDisposition | null;
export function parseContentDisposition(
    header: string | null | undefined,
    options?: ContentDispositionParseOptions,
): ContentDisposition | null {
    if (header === null || header === undefined) {
        return null;
    }

    try {
        return parse(header, options && {
            extended: options.extended,
            multipart: options.multipart,
        });
    } catch (cause) {
        throw new AppError({
            status: 400,
            message: 'Invalid Content-Disposition header.',
            cause,
        });
    }
}

function setContentDisposition(
    event: IAppEvent,
    type: ContentDispositionType,
    filename?: string,
) {
    if (typeof filename === 'string') {
        setResponseContentTypeByFileName(event, filename);
    }

    event.response.headers.set(
        HeaderName.CONTENT_DISPOSITION,
        createContentDisposition(filename, { type }),
    );
}

export function setResponseHeaderAttachment(event: IAppEvent, filename?: string) {
    setContentDisposition(event, 'attachment', filename);
}

export function setResponseHeaderInline(event: IAppEvent, filename?: string) {
    setContentDisposition(event, 'inline', filename);
}
