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
 * Split an entity-tag list at the commas between its entries. A comma
 * inside a quoted tag belongs to the tag (RFC 9110 section 8.8.3).
 */
function splitEntityTags(header: string): string[] {
    const entries: string[] = [];
    let quoted = false;
    let start = 0;

    for (let i = 0; i < header.length; i++) {
        const char = header[i];

        if (char === '"') {
            quoted = !quoted;
        } else if (char === ',' && !quoted) {
            entries.push(header.slice(start, i).trim());
            start = i + 1;
        }
    }

    entries.push(header.slice(start).trim());

    return entries;
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

    return splitEntityTags(header).some((entry) => stripWeakPrefix(entry) === target);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = `(${MONTHS.join('|')})`;
const TIME = '(\\d{2}):(\\d{2}):(\\d{2})';

const IMF_FIXDATE = new RegExp(`^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\\d{2}) ${MONTH} (\\d{4}) ${TIME} GMT$`);
const RFC_850_DATE = new RegExp(`^(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day, (\\d{2})-${MONTH}-(\\d{2}) ${TIME} GMT$`);
const ASCTIME_DATE = new RegExp(`^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) ${MONTH} ([ \\d]\\d) ${TIME} (\\d{4})$`);

function toTimestamp(
    year: number,
    month: string,
    day: string,
    hours: string,
    minutes: string,
    seconds: string,
): number {
    return Date.UTC(year, MONTHS.indexOf(month), Number(day), Number(hours), Number(minutes), Number(seconds));
}

/**
 * Parse a single HTTP-date (RFC 9110 section 5.6.7) into a timestamp.
 * Anything else — an ISO date, a number, a date list, another time
 * zone — is `NaN`: a recipient must ignore such a value rather than
 * guess at it.
 */
function parseHttpDate(value: string): number {
    let match = IMF_FIXDATE.exec(value);

    if (match) {
        return toTimestamp(Number(match[3]), match[2]!, match[1]!, match[4]!, match[5]!, match[6]!);
    }

    match = RFC_850_DATE.exec(value);

    if (match) {
        // A two-digit year more than 50 years ahead is in the past century.
        let year = Math.floor(new Date().getUTCFullYear() / 100) * 100 + Number(match[3]);

        if (year > new Date().getUTCFullYear() + 50) {
            year -= 100;
        }

        return toTimestamp(year, match[2]!, match[1]!, match[4]!, match[5]!, match[6]!);
    }

    match = ASCTIME_DATE.exec(value);

    if (match) {
        return toTimestamp(Number(match[6]), match[1]!, match[2]!, match[3]!, match[4]!, match[5]!);
    }

    return NaN;
}

/**
 * Whether an `If-Modified-Since` header value is at or after the
 * modification time. A missing header, or one that is not a single
 * HTTP-date, never matches.
 */
export function isNotModifiedSince(header: string | null | undefined, lastModified: Date | string): boolean {
    if (!header) {
        return false;
    }

    const modifiedTime = typeof lastModified === 'string' ?
        new Date(lastModified) :
        lastModified;

    const since = parseHttpDate(header);
    const modified = modifiedTime.getTime();

    if (Number.isNaN(since) || Number.isNaN(modified)) {
        return false;
    }

    return since >= modified;
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
