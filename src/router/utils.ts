import { PathMatcher } from '../path/index.ts';
import type { IPathMatcher } from '../path/index.ts';
import type { ObjectLiteral, Route } from '../types.ts';

/**
 * Build a path-to-regexp-backed `PathMatcher` for the route's mount
 * path, applying the exact-vs-prefix convention every router should
 * agree on:
 *
 * - `route.method !== undefined` → exact match (method-bound route)
 * - `route.method === undefined` → prefix match (middleware / nested
 *   app)
 *
 * Returns `undefined` when the route has no mount path — middleware
 * registered without a path matches every request.
 *
 * Routers are free to ignore this helper and build their own match
 * mechanism (radix tree, single aggregated regex, etc.) — it's
 * provided as a convenience for routers that want path-to-regexp
 * semantics with minimal boilerplate.
 */
export function buildRoutePathMatcher<T extends ObjectLiteral = ObjectLiteral>(
    route: Route<T>,
): IPathMatcher | undefined {
    if (typeof route.path === 'undefined') {
        return undefined;
    }

    const end = typeof route.method !== 'undefined';

    // For prefix matchers a lone '/' contributes nothing useful (it
    // matches every URL), so skip building it. Exact matchers must
    // honor '/' — `app.get('/', …)` matches the root only.
    if (!end && route.path === '/') {
        return undefined;
    }

    return new PathMatcher(route.path, { end });
}
