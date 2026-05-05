import { MethodName } from '../constants.ts';
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

/**
 * Match a request method against a handler's bound method.
 *
 * - When the handler has no method bound, matches every request method.
 * - Otherwise matches when the request method is the same.
 * - HEAD requests additionally match GET handlers.
 */
export function matchHandlerMethod(
    handlerMethod: MethodName | undefined,
    requestMethod: MethodName,
): boolean {
    return !handlerMethod ||
        requestMethod === handlerMethod ||
        (requestMethod === MethodName.HEAD && handlerMethod === MethodName.GET);
}
