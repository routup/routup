import { describe, expect, it } from 'vitest';
import { LinearRouter, TrieRouter } from '../../../src';
import type { IRouter } from '../../../src';
import { MethodName } from '../../../src/constants';

/**
 * Plan-014 compliance — `IRouter<T>` must work with arbitrary opaque
 * data, not just App's `RouteEntry`. Each test exercises a router with
 * a custom `MyData` shape end-to-end:
 *
 * 1. Stored data flows through unchanged (router never mutates / never
 *    inspects `route.data`).
 * 2. Exact-vs-prefix semantics are governed purely by `route.method`
 *    (set → exact match, unset → prefix match) per the convention
 *    documented on `IRouter<T>`.
 * 3. Params and `path` are populated as for the RouteEntry case.
 */

type MyData = {
    name: string;
    tag: number;
};

type ResolverFactory = () => IRouter<MyData>;

const resolvers: Record<string, ResolverFactory> = {
    linear: () => new LinearRouter<MyData>(),
    trie: () => new TrieRouter<MyData>(),
};

describe.each(Object.entries(resolvers))('IRouter<MyData> generic — %s', (_name, factory) => {
    it('stores and returns custom data opaquely', () => {
        const router = factory();
        router.add({
            path: '/users',
            method: MethodName.GET,
            data: { name: 'users-list', tag: 1 },
        });

        const matches = router.lookup('/users');
        expect(matches).toHaveLength(1);
        expect(matches[0]!.route.data).toEqual({ name: 'users-list', tag: 1 });
    });

    it('treats method-bound routes as exact-match (no prefix bleed)', () => {
        const router = factory();
        router.add({
            path: '/users',
            method: MethodName.GET,
            data: { name: 'users', tag: 1 },
        });

        // Exact match → '/users' hits.
        expect(router.lookup('/users')).toHaveLength(1);
        // Prefix probe '/users/42' must NOT match a method-bound route.
        expect(router.lookup('/users/42')).toHaveLength(0);
    });

    it('treats method-less routes as prefix-match', () => {
        const router = factory();
        router.add({
            path: '/api',
            data: { name: 'mw', tag: 2 },
        });

        expect(router.lookup('/api')).toHaveLength(1);
        expect(router.lookup('/api/users')).toHaveLength(1);
        expect(router.lookup('/other')).toHaveLength(0);
    });

    it('extracts params and path for parametric routes', () => {
        const router = factory();
        router.add({
            path: '/users/:id',
            method: MethodName.GET,
            data: { name: 'user-by-id', tag: 3 },
        });

        const matches = router.lookup('/users/42');
        expect(matches).toHaveLength(1);
        expect(matches[0]!.params).toEqual({ id: '42' });
        expect(matches[0]!.path).toBe('/users/42');
        expect(matches[0]!.route.data.name).toBe('user-by-id');
    });

    it('preserves registration order in lookup results', () => {
        const router = factory();
        router.add({
            path: '/x',
            method: MethodName.GET,
            data: { name: 'a', tag: 1 },
        });
        router.add({
            path: '/x',
            method: MethodName.GET,
            data: { name: 'b', tag: 2 },
        });
        router.add({
            path: '/x',
            method: MethodName.GET,
            data: { name: 'c', tag: 3 },
        });

        const matches = router.lookup('/x');
        expect(matches.map((m) => m.route.data.name)).toEqual(['a', 'b', 'c']);
    });

    it('routes getter returns a defensive copy (mutation does not desync state)', () => {
        const router = factory();
        router.add({
            path: '/x',
            method: MethodName.GET,
            data: { name: 'a', tag: 1 },
        });

        // `readonly` is compile-time only. Cast through unknown and mutate
        // the returned array — the router's internal state must not change.
        const snapshot = router.routes as unknown as { path?: string }[];
        snapshot.push({});
        snapshot.length = 0;

        // After mutating the returned array, the router still reports
        // its real internal length.
        expect(router.routes.length).toBe(1);
        // And lookup still finds the route.
        expect(router.lookup('/x')).toHaveLength(1);
    });

    it('memoizes lookup by default (repeated lookups hit the cache)', () => {
        const router = factory();
        router.add({
            path: '/x',
            method: MethodName.GET,
            data: { name: 'a', tag: 1 },
        });

        const first = router.lookup('/x');
        const second = router.lookup('/x');

        // Same array reference — cache returned the cached value
        // (no defensive copy on hit, by design — RouteMatch[] is
        // treated as immutable).
        expect(second).toBe(first);
    });

    it('clone() returns an empty router of the same shape', () => {
        const router = factory();
        router.add({
            path: '/x',
            method: MethodName.GET,
            data: { name: 'a', tag: 1 },
        });

        const cloned = router.clone();
        expect(cloned.routes).toHaveLength(0);
        // Original retained.
        expect(router.routes).toHaveLength(1);
        // Adding to clone does not bleed back.
        cloned.add({
            path: '/y',
            method: MethodName.GET,
            data: { name: 'b', tag: 2 },
        });
        expect(router.routes).toHaveLength(1);
    });
});
