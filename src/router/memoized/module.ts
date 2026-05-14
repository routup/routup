import type { StackEntry } from '../../app/types.ts';
import type { IRouter, RouterMatch } from '../types.ts';

/**
 * Wraps another `IRouter` and caches `lookup` results by path.
 * Repeated requests for the same path skip the underlying resolver
 * entirely; the cache is cleared whenever a new entry is registered
 * (a previously path-mismatching entry might match a cached path now).
 *
 * Useful when the underlying resolver's `lookup` is non-trivial (many
 * entries, expensive pattern matches) and an app sees the same paths
 * repeatedly. Compose around any other resolver:
 *
 * ```ts
 * new App({
 *   router: new MemoizedRouter(new TrieRouter()),
 * });
 * ```
 */
export class MemoizedRouter implements IRouter {
    protected inner: IRouter;

    protected cache: Map<string, readonly RouterMatch[]> = new Map();

    constructor(inner: IRouter) {
        this.inner = inner;
    }

    add(entry: StackEntry): void {
        this.inner.add(entry);
        // Any new entry can change the match set for any cached path,
        // so invalidate the whole cache.
        this.cache.clear();
    }

    lookup(path: string): readonly RouterMatch[] {
        const cached = this.cache.get(path);
        if (typeof cached !== 'undefined') {
            return cached;
        }
        const fresh = this.inner.lookup(path);
        this.cache.set(path, fresh);
        return fresh;
    }

    get entries(): readonly StackEntry[] {
        return this.inner.entries;
    }

    clone(): IRouter {
        return new MemoizedRouter(this.inner.clone());
    }
}
