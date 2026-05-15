export const MethodName = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
    OPTIONS: 'OPTIONS',
    HEAD: 'HEAD',
} as const;

export type MethodName = typeof MethodName[keyof typeof MethodName];

/**
 * `MethodName` plus the open-enum escape hatch for non-standard
 * methods (`PROPFIND`, `MKCOL`, custom verbs). The `(string & {})`
 * intersection is structurally identical to `string` but TypeScript
 * doesn't collapse the union — so callers still get autocomplete
 * for the canonical methods while remaining free to pass anything.
 */
export type MethodNameLike = MethodName | (string & {});

export const HeaderName = {
    ACCEPT: 'accept',
    ACCEPT_CHARSET: 'accept-charset',
    ACCEPT_ENCODING: 'accept-encoding',
    ACCEPT_LANGUAGE: 'accept-language',
    ACCEPT_RANGES: 'accept-ranges',
    ALLOW: 'allow',
    CACHE_CONTROL: 'cache-control',
    CONTENT_DISPOSITION: 'content-disposition',
    CONTENT_ENCODING: 'content-encoding',
    CONTENT_LENGTH: 'content-length',
    CONTENT_RANGE: 'content-range',
    CONTENT_TYPE: 'content-type',
    CONNECTION: 'connection',
    COOKIE: 'cookie',
    ETag: 'etag',
    HOST: 'host',
    IF_MODIFIED_SINCE: 'if-modified-since',
    IF_NONE_MATCH: 'if-none-match',
    LAST_MODIFIED: 'last-modified',
    LOCATION: 'location',
    RANGE: 'range',
    RATE_LIMIT_LIMIT: 'ratelimit-limit',
    RATE_LIMIT_REMAINING: 'ratelimit-remaining',
    RATE_LIMIT_RESET: 'ratelimit-reset',
    RETRY_AFTER: 'retry-after',
    SET_COOKIE: 'set-cookie',
    TRANSFER_ENCODING: 'transfer-encoding',
    X_ACCEL_BUFFERING: 'x-accel-buffering',
    X_FORWARDED_HOST: 'x-forwarded-host',
    X_FORWARDED_FOR: 'x-forwarded-for',
    X_FORWARDED_PROTO: 'x-forwarded-proto',
} as const;

export type HeaderName = typeof HeaderName[keyof typeof HeaderName];
