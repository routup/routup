import type { ICache } from '../../cache/index.ts';
import type { IPathMatcher } from '../../path/index.ts';
import type { ObjectLiteral, Route, RouteMatch } from '../../types.ts';
import type { BaseRouterOptions, IRouter } from '../types.ts';
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
 *
 * Optional per-router lookup cache: pass an `ICache` via
 * `BaseRouterOptions.cache` to skip the linear walk on repeated
 * requests for the same path. Default is no caching.
 */
export class LinearRouter<T extends ObjectLiteral = ObjectLiteral> implements IRouter<T> {
    protected _routes: Route<T>[];

    protected _matchers: (IPathMatcher | undefined)[];

    protected cache?: ICache<readonly RouteMatch<T>[]>;

    constructor(options: BaseRouterOptions<T> = {}) {
        this._routes = [];
        this._matchers = [];
        this.cache = options.cache;
    }

    add(route: Route<T>): void {
        this._routes.push(route);
        this._matchers.push(buildRoutePathMatcher(route));
        // A new route can change the match set for any cached path —
        // drop the whole cache. Conservative; per-path invalidation
        // would require knowing which paths the new route can match.
        this.cache?.clear();
    }

    lookup(path: string, _method?: string): readonly RouteMatch<T>[] {
        // LinearRouter ignores `method`: the dispatcher's own
        // `matchHandlerMethod` check runs on every returned candidate
        // anyway, so we simply emit every path-matching route and let
        // the call site discriminate. Method-aware routers (TrieRouter)
        // narrow at lookup time for the per-request perf win.
        const cached = this.cache?.get(path);
        if (typeof cached !== 'undefined') {
            return cached;
        }

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

        this.cache?.set(path, matches);
        return matches;
    }

    clone(): IRouter<T> {
        // Carry the cache *shape* forward (not contents) — fresh
        // cache, same configured class/size. Absent stays absent.
        return new LinearRouter<T>({ cache: this.cache?.clone() });
    }
}
