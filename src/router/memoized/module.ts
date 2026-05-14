import type { ObjectLiteral, Route, RouteMatch } from '../../types.ts';
import type { IRouter } from '../types.ts';

/**
 * Wraps another `IRouter` and caches `lookup` results by path.
 * Repeated requests for the same path skip the underlying router
 * entirely; the cache is cleared whenever a new route is registered
 * (a previously path-mismatching route might match a cached path now).
 *
 * Useful when the underlying router's `lookup` is non-trivial (many
 * routes, expensive pattern matches) and an app sees the same paths
 * repeatedly. Compose around any other router:
 *
 * ```ts
 * new App({
 *   router: new MemoizedRouter(new TrieRouter()),
 * });
 * ```
 */
export class MemoizedRouter<T extends ObjectLiteral = ObjectLiteral> implements IRouter<T> {
    protected inner: IRouter<T>;

    protected cache: Map<string, readonly RouteMatch<T>[]>;

    constructor(inner: IRouter<T>) {
        this.inner = inner;
        this.cache = new Map();
    }

    add(route: Route<T>): void {
        this.inner.add(route);
        // Any new route can change the match set for any cached path,
        // so invalidate the whole cache.
        this.cache.clear();
    }

    lookup(path: string): readonly RouteMatch<T>[] {
        const cached = this.cache.get(path);
        if (typeof cached !== 'undefined') {
            return cached;
        }
        const fresh = this.inner.lookup(path);
        this.cache.set(path, fresh);
        return fresh;
    }

    get routes(): readonly Route<T>[] {
        return this.inner.routes;
    }

    clone(): IRouter<T> {
        return new MemoizedRouter<T>(this.inner.clone());
    }
}
