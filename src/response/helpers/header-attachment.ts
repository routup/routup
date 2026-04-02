import { HeaderName } from '../../constants';

import type { Response } from '../types';
import { setResponseContentTypeByFileName } from './utils';

function sanitizeFilename(filename: string) : string {
    return filename.replace(/[\r\n]/g, '');
}

function toAsciiFilename(filename: string) : string {
    // Strip non-ASCII characters and escape double quotes
    return filename.replace(/[^\x20-\x7E]/g, '').replace(/"/g, '\\"');
}

function encodeRfc5987(filename: string) : string {
    return encodeURIComponent(filename)
        .replace(/['()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
        .replace(/\*/g, '%2A');
}

export function setResponseHeaderAttachment(res: Response, filename?: string) {
    if (typeof filename === 'string') {
        setResponseContentTypeByFileName(res, filename);
    }

    let disposition = 'attachment';

    if (filename) {
        const sanitized = sanitizeFilename(filename);
        const ascii = toAsciiFilename(sanitized);
        disposition += `; filename="${ascii}"`;
        disposition += `; filename*=UTF-8''${encodeRfc5987(sanitized)}`;
    }

    res.setHeader(
        HeaderName.CONTENT_DISPOSITION,
        disposition,
    );
}
