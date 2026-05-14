import QuickLRU from 'quick-lru';
import type { ICache } from './types.ts';

export type LruCacheOptions = {
    /**
     * Maximum number of entries before the least-recently-used entry
     * is evicted on `set`. Default: `1024`.
     */
    maxSize?: number;
};

const DEFAULT_MAX_SIZE = 1024;

/**
 * Default `ICache` implementation — a bounded LRU backed by
 * [`quick-lru`](https://github.com/sindresorhus/quick-lru). Picked for
 * its small footprint (~1kB), ESM-only build (matches routup), and
 * stable API.
 *
 * For TTL, size-based eviction, or dispose hooks, write your own
 * `ICache` (e.g. wrapping `lru-cache`) and pass it via
 * `AppOptionsInput.cache`.
 */
export class LruCache<V extends {}> implements ICache<V> {
    protected options: LruCacheOptions;

    protected inner: QuickLRU<string, V>;

    constructor(options: LruCacheOptions = {}) {
        this.options = options;
        this.inner = new QuickLRU<string, V>({ maxSize: options.maxSize ?? DEFAULT_MAX_SIZE });
    }

    get(key: string): V | undefined {
        return this.inner.get(key);
    }

    set(key: string, value: V): void {
        this.inner.set(key, value);
    }

    delete(key: string): void {
        this.inner.delete(key);
    }

    clear(): void {
        this.inner.clear();
    }

    clone(): ICache<V> {
        // Carry options forward so a clone preserves `maxSize` (and
        // any future config). Empty per the IRouter/ICache convention.
        return new LruCache<V>({ ...this.options });
    }
}
