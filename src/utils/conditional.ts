export type ConditionalRequestHeaders = {
    ifNoneMatch?: string | null,
    ifModifiedSince?: string | null,
};

export type ConditionalValidators = {
    etag?: string,
    lastModified?: Date | string,
};

function stripWeakPrefix(etag: string): string {
    return etag.startsWith('W/') ? etag.slice(2) : etag;
}

/**
 * Whether an `If-None-Match` header value matches the given etag.
 * The header is `*` or a comma separated list; entries are compared
 * weakly (a `W/` prefix on either side is ignored).
 */
export function matchesETagList(header: string | null | undefined, etag: string): boolean {
    if (!header) {
        return false;
    }

    if (header === '*') {
        return true;
    }

    const target = stripWeakPrefix(etag);

    return header.split(',').some((entry) => stripWeakPrefix(entry.trim()) === target);
}

/**
 * Whether an `If-Modified-Since` header value is at or after the
 * modification time. Missing or unparsable dates never match.
 */
export function isNotModifiedSince(header: string | null | undefined, lastModified: Date | string): boolean {
    if (!header) {
        return false;
    }

    const modifiedTime = typeof lastModified === 'string' ?
        new Date(lastModified) :
        lastModified;

    const sinceDate = new Date(header);

    if (Number.isNaN(sinceDate.getTime()) || Number.isNaN(modifiedTime.getTime())) {
        return false;
    }

    return sinceDate >= modifiedTime;
}

/**
 * Whether the client's cached copy is fresh (RFC 9110 section 13.2.2):
 * a present `If-None-Match` alone decides and `If-Modified-Since` is
 * ignored; otherwise `If-Modified-Since` decides. A request without
 * either header is never fresh.
 */
export function isFresh(
    request: ConditionalRequestHeaders,
    validators: ConditionalValidators,
): boolean {
    // Presence, not truthiness: an empty `If-None-Match` is still
    // present, matches no tag, and suppresses `If-Modified-Since`.
    if (typeof request.ifNoneMatch === 'string') {
        return !!validators.etag && matchesETagList(request.ifNoneMatch, validators.etag);
    }

    if (request.ifModifiedSince) {
        return !!validators.lastModified && isNotModifiedSince(request.ifModifiedSince, validators.lastModified);
    }

    return false;
}
