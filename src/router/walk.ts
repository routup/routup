import type { IPathMatcher } from '../path/index.ts';
import type { ObjectLiteral, Route, RouteMatch } from '../types.ts';

/**
 * Match one route of a linear walk against the request path.
 *
 * - With a `matcher` (built by `buildRoutePathMatcher`): run it and
 *   return its params and consumed path, or `undefined` when it
 *   rejects the path.
 * - Without one (the route has no mount path, or is a prefix route on
 *   `/`): the route matches every request. `params` is a fresh
 *   prototype-less object and the match carries no `path`.
 *
 * Shared by `LinearRouter` and the `TrieRouter`'s universal bucket.
 */
export function matchLinearRoute<T extends ObjectLiteral>(
    route: Route<T>,
    index: number,
    matcher: IPathMatcher | undefined,
    path: string,
): RouteMatch<T> | undefined {
    if (!matcher) {
        return {
            route,
            index,
            // Prototype-less, so `'foo' in match.params` and
            // `__proto__` keys never reach `Object.prototype`.
            params: Object.create(null) as Record<string, string | undefined>,
        };
    }

    const output = matcher.exec(path);

    if (typeof output === 'undefined') {
        return undefined;
    }

    // `PathMatcher.exec` builds a fresh prototype-less params object
    // per call, so it is handed out without a copy.
    return {
        route,
        index,
        params: output.params,
        path: output.path,
    };
}
