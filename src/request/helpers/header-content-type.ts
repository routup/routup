import { HeaderName } from '../../constants.ts';
import { AppError } from '../../error/index.ts';
import { getMimeType } from '../../utils/index.ts';
import type { IAppEvent } from '../../event/index.ts';
import { getRequestHeader } from './header.ts';

export function matchRequestContentType(event: IAppEvent, contentType: string) : boolean {
    const header = getRequestHeader(event, HeaderName.CONTENT_TYPE);

    if (!header) {
        return true;
    }

    return header.split(';')[0]!.trim() === getMimeType(contentType);
}

function normalizeMediaType(input: string) : string {
    return input.split(';')[0]!.trim().toLowerCase();
}

function matchMediaType(actual: string, expected: string) : boolean {
    if (actual === expected) {
        return true;
    }

    const [actualType, actualSubtype] = actual.split('/') as [string, string];
    const [expectedType, expectedSubtype] = expected.split('/');

    if (!expectedSubtype || expectedType !== actualType) {
        return false;
    }

    if (expectedSubtype === '*') {
        return true;
    }

    if (expectedSubtype.startsWith('*+')) {
        return actualSubtype.endsWith(expectedSubtype.slice(1));
    }

    return false;
}

/**
 * Assert that the request Content-Type is one of the given types.
 * Returns the request media type (lowercased, without parameters).
 *
 * Throws 415 for a missing header or an unlisted type, 400 for a malformed header.
 */
export function assertRequestContentType(event: IAppEvent, types: string | string[]) : string {
    const header = getRequestHeader(event, HeaderName.CONTENT_TYPE);

    if (!header) {
        throw new AppError({ status: 415, message: 'The Content-Type header is missing.' });
    }

    const mediaType = normalizeMediaType(header);
    const parts = mediaType.split('/');

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new AppError({ status: 400, message: 'The Content-Type header is malformed.' });
    }

    const expected = (Array.isArray(types) ? types : [types]).map(normalizeMediaType);

    const unmatched = expected.every((type) => !matchMediaType(mediaType, type));

    if (unmatched) {
        throw new AppError({
            status: 415,
            message: `Unsupported Content-Type. Expected: ${expected.join(', ')}.`,
        });
    }

    return mediaType;
}
