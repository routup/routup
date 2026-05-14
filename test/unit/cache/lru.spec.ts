import { describe, expect, it } from 'vitest';
import { LruCache } from '../../../src';

describe('LruCache', () => {
    it('stores and retrieves values', () => {
        const cache = new LruCache<string>();
        cache.set('a', 'A');
        cache.set('b', 'B');

        expect(cache.get('a')).toBe('A');
        expect(cache.get('b')).toBe('B');
    });

    it('returns undefined for absent keys', () => {
        const cache = new LruCache<string>();
        expect(cache.get('missing')).toBeUndefined();
    });

    it('overwrites existing values on set', () => {
        const cache = new LruCache<string>();
        cache.set('k', 'first');
        cache.set('k', 'second');

        expect(cache.get('k')).toBe('second');
    });

    it('delete removes a single entry', () => {
        const cache = new LruCache<string>();
        cache.set('a', 'A');
        cache.set('b', 'B');

        cache.delete('a');

        expect(cache.get('a')).toBeUndefined();
        expect(cache.get('b')).toBe('B');
    });

    it('delete is a no-op for absent keys', () => {
        const cache = new LruCache<string>();
        // Must not throw.
        expect(() => cache.delete('missing')).not.toThrow();
    });

    it('clear drops every entry', () => {
        const cache = new LruCache<string>();
        cache.set('a', 'A');
        cache.set('b', 'B');

        cache.clear();

        expect(cache.get('a')).toBeUndefined();
        expect(cache.get('b')).toBeUndefined();
    });

    it('eventually evicts old entries once well past maxSize', () => {
        // quick-lru uses two-bucket rotation: it can hold up to
        // 2 * maxSize entries before the oldest are dropped. With
        // maxSize=2, inserting 5 entries guarantees the first one
        // has been evicted, but the most recent ones are kept.
        const cache = new LruCache<string>({ maxSize: 2 });
        cache.set('a', 'A');
        cache.set('b', 'B');
        cache.set('c', 'C');
        cache.set('d', 'D');
        cache.set('e', 'E');

        expect(cache.get('a')).toBeUndefined();
        expect(cache.get('e')).toBe('E');
    });

    it('clone returns a fresh empty cache of the same shape', () => {
        const cache = new LruCache<string>({ maxSize: 4 });
        cache.set('a', 'A');

        const cloned = cache.clone();

        // Clone has no entries.
        expect(cloned.get('a')).toBeUndefined();
        // Original is unchanged.
        expect(cache.get('a')).toBe('A');
        // Distinct instance.
        expect(cloned).not.toBe(cache);
    });

    it('clone preserves maxSize', () => {
        const cache = new LruCache<string>({ maxSize: 2 });
        const cloned = cache.clone();

        cloned.set('a', 'A');
        cloned.set('b', 'B');
        cloned.set('c', 'C');
        cloned.set('d', 'D');
        cloned.set('e', 'E');

        // Same eviction shape as the parent — well past maxSize,
        // 'a' has been dropped while the most recent insert remains.
        expect(cloned.get('a')).toBeUndefined();
        expect(cloned.get('e')).toBe('E');
    });
});
