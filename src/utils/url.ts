const TRAILING_SLASH_RE = /\/$|\/\?/;

export function hasTrailingSlash(input = '', queryParams = false): boolean {
    if (!queryParams) {
        return input.endsWith('/');
    }

    return TRAILING_SLASH_RE.test(input);
}

export function withoutTrailingSlash(input = '', queryParams = false): string {
    if (!queryParams) {
        return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || '/';
    }

    if (!hasTrailingSlash(input, true)) {
        return input || '/';
    }

    const [s0, ...s] = input.split('?');

    return (s0!.slice(0, -1) || '/') + (s.length ? `?${s.join('?')}` : '');
}

export function withTrailingSlash(input = '', queryParams = false): string {
    if (!queryParams) {
        return input.endsWith('/') ? input : (`${input}/`);
    }

    if (hasTrailingSlash(input, true)) {
        return input || '/';
    }

    const [s0, ...s] = input.split('?');

    return `${s0}/${s.length ? `?${s.join('?')}` : ''}`;
}

export function hasLeadingSlash(input = ''): boolean {
    return input.startsWith('/');
}

export function withoutLeadingSlash(input = ''): string {
    return (hasLeadingSlash(input) ? input.substring(1) : input) || '/';
}

// A path that starts with a slash-led optional group (`{/*rest}`) carries its
// own slash: another one in front makes the group match only `/` and `//…`
// (#1014). A group without one (`{users}`) still needs the slash.
function startsWithSlashGroup(input: string): boolean {
    return input.startsWith('{/');
}

export function withLeadingSlash(input = ''): string {
    return hasLeadingSlash(input) || startsWithSlashGroup(input) ? input : `/${input}`;
}

export function cleanDoubleSlashes(input = ''): string {
    if (input.includes('://')) {
        return input.split('://')
            .map((str) => cleanDoubleSlashes(str))
            .join('://');
    }

    return input.replace(/\/+/g, '/');
}

/**
 * Concatenate path parts into a single mount path.
 *
 * - Drops `undefined` and empty parts.
 * - A lone `'/'` part still contributes (so `joinPaths('/')` returns
 *   `'/'`, distinguishing "match the root exactly" from "no path").
 * - Returns `undefined` when every part is missing — callers
 *   interpret this as "no path" (always-match middleware).
 * - Joins remaining parts with `/`, except a part that starts with a
 *   slash-led optional group (`{/*rest}`), which replaces the slash; collapses
 *   any inner `//`, and trims a trailing slash on results longer than `/`.
 *
 * Used at registration time to fold a handler / router's intrinsic
 * path into the mount path so the active `IRouter` is the
 * only place that builds path matchers.
 */
export function joinPaths(...parts: Array<string | undefined>): string | undefined {
    const kept: string[] = [];

    for (const part of parts) {
        if (typeof part !== 'string' || part === '') {
            continue;
        }

        kept.push(part);
    }

    if (kept.length === 0) {
        return undefined;
    }

    let joined = '';

    for (const part of kept) {
        if (startsWithSlashGroup(part)) {
            // drop the separator a mount path like `/` or `/x/` ends with
            while (joined.endsWith('/')) {
                joined = joined.slice(0, -1);
            }

            joined += part;
        } else {
            joined += `/${part}`;
        }
    }

    const normalized = cleanDoubleSlashes(joined);

    if (normalized.length > 1 && normalized.endsWith('/')) {
        return normalized.slice(0, -1);
    }

    return normalized;
}
