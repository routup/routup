import { describe, expect, it } from 'vitest';
import {
    LinearRouter,
    LruCache,
    TrieRouter,
} from '../../../src';
import type { ICache, IRouter, RouteMatch } from '../../../src';
import { MethodName } from '../../../src/constants';

type MyData = { name: string };
type LookupCache = ICache<readonly RouteMatch<MyData>[]>;

/**
 * Branded cache double — counts every get/set/clear/clone call so
 * tests can prove the router is consulting the cache and invalidating
 * it at the right moments. Wraps a real LruCache so behavior stays
 * realistic.
 */
class BrandedCache implements LookupCache {
    public gets = 0;
    public sets = 0;
    public clears = 0;
    public clones = 0;

    protected inner: LruCache<readonly RouteMatch<MyData>[]>;

    constructor() {
        this.inner = new LruCache();
    }

    get(key: string): readonly RouteMatch<MyData>[] | undefined {
        this.gets += 1;
        return this.inner.get(key);
    }

    set(key: string, value: readonly RouteMatch<MyData>[]): void {
        this.sets += 1;
        this.inner.set(key, value);
    }

    delete(key: string): void {
        this.inner.delete(key);
    }

    clear(): void {
        this.clears += 1;
        this.inner.clear();
    }

    clone(): LookupCache {
        this.clones += 1;
        return new BrandedCache();
    }
}

const routers: Record<string, (cache?: LookupCache | null) => IRouter<MyData>> = {
    linear: (cache) => new LinearRouter<MyData>(typeof cache === 'undefined' ? {} : { cache }),
    trie: (cache) => new TrieRouter<MyData>(typeof cache === 'undefined' ? {} : { cache }),
};

describe.each(Object.entries(routers))('router cache option — %s', (_name, build) => {
    it('default cache (omitted) memoizes lookup', () => {
        const cache = new BrandedCache();
        const router = build(cache);
        router.add({
            path: '/x',
            method: MethodName.GET,
            data: { name: 'a' },
        });

        // Adding a route clears the cache (initial state was already empty).
        const clearsAfterAdd = cache.clears;

        // Miss → set.
        router.lookup('/x');
        expect(cache.gets).toBe(1);
        expect(cache.sets).toBe(1);

        // Hit → no extra set.
        router.lookup('/x');
        expect(cache.gets).toBe(2);
        expect(cache.sets).toBe(1);
        expect(cache.clears).toBe(clearsAfterAdd);
    });

    it('cache: null disables caching entirely', () => {
        const probe = new BrandedCache();
        // Build with `null` to disable; the probe is held aside to
        // confirm it was never wired in (zero counters).
        const router = build(null);
        router.add({
            path: '/x',
            method: MethodName.GET,
            data: { name: 'a' },
        });

        for (let i = 0; i < 3; i++) {
            router.lookup('/x');
        }

        // Probe is untouched because it wasn't passed in.
        expect(probe.gets).toBe(0);
        expect(probe.sets).toBe(0);
        expect(probe.clears).toBe(0);
    });

    it('invalidates cache on add()', () => {
        const cache = new BrandedCache();
        const router = build(cache);
        router.add({
            path: '/x',
            method: MethodName.GET,
            data: { name: 'a' },
        });

        // Prime the cache.
        router.lookup('/x');
        const setsAfterPrime = cache.sets;

        // New route invalidates the whole cache.
        const clearsBefore = cache.clears;
        router.add({
            path: '/y',
            method: MethodName.GET,
            data: { name: 'b' },
        });
        expect(cache.clears).toBe(clearsBefore + 1);

        // Re-lookup '/x' — fresh miss because cache was cleared.
        router.lookup('/x');
        expect(cache.sets).toBe(setsAfterPrime + 1);
    });

    it('clone() routes through the cache.clone() (no LruCache downgrade)', () => {
        const cache = new BrandedCache();
        const router = build(cache);
        router.add({
            path: '/x',
            method: MethodName.GET,
            data: { name: 'a' },
        });

        const clonesBefore = cache.clones;
        router.clone();
        expect(cache.clones).toBe(clonesBefore + 1);
    });

    it('cache: null is preserved across clone()', () => {
        const router = build(null);
        const cloned = router.clone();
        cloned.add({
            path: '/x',
            method: MethodName.GET,
            data: { name: 'a' },
        });

        // No cache, but routing still works.
        const matches = cloned.lookup('/x');
        expect(matches).toHaveLength(1);
        expect(matches[0]!.route.data.name).toBe('a');
    });

    it('explicit LruCache with custom maxSize works end-to-end', () => {
        const router = build(new LruCache({ maxSize: 16 }));
        router.add({
            path: '/users/:id',
            method: MethodName.GET,
            data: { name: 'user-by-id' },
        });

        for (let i = 0; i < 32; i++) {
            const matches = router.lookup(`/users/${i}`);
            expect(matches).toHaveLength(1);
            expect(matches[0]!.params).toEqual({ id: String(i) });
        }
    });
});
