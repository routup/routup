import { LruCache } from '../../cache/index.ts';
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
 * Carries a per-router lookup cache (default: bounded LRU) so repeated
 * requests for the same path skip the linear walk. Pass `cache: null`
 * via `BaseRouterOptions` to disable.
 */
export class LinearRouter<T extends ObjectLiteral = ObjectLiteral> implements IRouter<T> {
    protected _routes: Route<T>[];

    protected _matchers: (IPathMatcher | undefined)[];

    protected cache: ICache<readonly RouteMatch<T>[]> | null;

    constructor(options: BaseRouterOptions<T> = {}) {
        this._routes = [];
        this._matchers = [];
        // Distinguish three states: explicit `null` disables caching,
        // explicit value passes through, omitted/`undefined` falls
        // back to the default bounded LRU.
        if (options.cache === null) {
            this.cache = null;
        } else if (typeof options.cache !== 'undefined') {
            this.cache = options.cache;
        } else {
            this.cache = new LruCache();
        }
    }

    add(route: Route<T>): void {
        this._routes.push(route);
        this._matchers.push(buildRoutePathMatcher(route));
        // A new route can change the match set for any cached path —
        // drop the whole cache. Conservative; per-path invalidation
        // would require knowing which paths the new route can match.
        this.cache?.clear();
    }

    lookup(path: string): readonly RouteMatch<T>[] {
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

    get routes(): readonly Route<T>[] {
        // Defensive copy — `readonly` is compile-time only. Returning
        // the live array would let JS callers `push`/`splice` it,
        // desynchronizing `_routes` from `_matchers` so subsequent
        // `lookup()` would read past the matcher list.
        return this._routes.slice();
    }

    clone(): IRouter<T> {
        // Carry the cache *shape* forward (not contents) — fresh
        // cache, same configured class/size. `null` passes through.
        return new LinearRouter<T>({ cache: this.cache === null ? null : this.cache.clone() });
    }
}
