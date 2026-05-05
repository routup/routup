import { PathMatcher } from '../path/index.ts';
import type { Path } from '../path/index.ts';
import { withLeadingSlash } from '../utils/index.ts';

/**
 * Build a `PathMatcher` for a handler-side path.
 *
 * Returns `undefined` when no path is supplied. The `end` flag controls
 * whether the matcher requires a full match (`true` for method handlers
 * matching exact routes) or accepts a prefix (`false` for middleware).
 */
export function buildHandlerPathMatcher(
    path: Path | undefined,
    end: boolean,
): PathMatcher | undefined {
    if (typeof path === 'undefined') {
        return undefined;
    }

    const normalized = typeof path === 'string' ? withLeadingSlash(path) : path;
    return new PathMatcher(normalized, { end });
}
