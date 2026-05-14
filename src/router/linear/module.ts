import type { IPathMatcher } from '../../path/index.ts';
import type { ObjectLiteral, Route, RouteMatch } from '../../types.ts';
import type { IRouter } from '../types.ts';
import { buildRoutePathMatcher } from '../utils.ts';

/**
 * Default router — walks registered routes linearly per request and
 * runs each route's mount-level matcher (built via `buildRoutePathMatcher`,
 * path-to-regexp-backed). Routes without a mount path (mount-less
 * middleware / nested apps registered via `.use(handler)`) match every
 * request directly — there is no per-route `matchPath()` fallback.
 *
 * Behaviour-preserving wrapper around the previous in-line stack walk
 * in `executePipelineStepLookup`. The matcher allocations live here
 * (not on the registered route), so routers using a different matching
 * strategy (radix tree, aggregated regex, …) can ignore this file
 * entirely.
 */
export class LinearRouter<T extends ObjectLiteral = ObjectLiteral> implements IRouter<T> {
    protected _routes: Route<T>[] = [];

    protected _matchers: (IPathMatcher | undefined)[] = [];

    add(route: Route<T>): void {
        this._routes.push(route);
        this._matchers.push(buildRoutePathMatcher(route));
    }

    lookup(path: string): readonly RouteMatch<T>[] {
        const matches: RouteMatch<T>[] = [];

        for (let i = 0; i < this._routes.length; i++) {
            const route = this._routes[i]!;
            const matcher = this._matchers[i];

            if (matcher) {
                const output = matcher.exec(path);
                if (typeof output === 'undefined') {
                    continue;
                }
                matches.push({
                    route,
                    index: i,
                    params: output.params,
                    path: output.path,
                });
                continue;
            }

            // No matcher → route has no mount path (middleware /
            // mount-less router). Matches every request.
            matches.push({
                route,
                index: i,
                // Prototype-less for symmetry with TrieRouter — avoids
                // `__proto__` / `hasOwnProperty` shadowing if user
                // code does `'foo' in match.params`.
                params: Object.create(null) as Record<string, any>,
            });
        }

        return matches;
    }

    get routes(): readonly Route<T>[] {
        return this._routes;
    }

    clone(): IRouter<T> {
        return new LinearRouter<T>();
    }
}
