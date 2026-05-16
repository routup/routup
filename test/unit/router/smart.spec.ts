import { describe, expect, it } from 'vitest';
import {
    App,
    LinearRouter,
    LruCache,
    SmartRouter,
    TrieRouter,
    defineCoreHandler,
} from '../../../src';
import type { RouteEntry } from '../../../src/app/types';
import { createTestRequest } from '../../helpers';

/**
 * `SmartRouter` accumulates registered routes in a pending buffer
 * until the first `lookup()`, then picks `LinearRouter` (tiny route
 * table) or `TrieRouter` (past threshold) and replays the pending
 * list onto it. Subsequent `add` / `lookup` / `clone` forward.
 */
describe('SmartRouter', () => {
    // The chosen inner router is a `protected` field — cast through
    // `unknown` to read it. Production code shouldn't depend on the
    // choice, only tests do.
    function inner(r: SmartRouter<RouteEntry>): unknown {
        return (r as unknown as { inner?: unknown }).inner;
    }

    it('picks LinearRouter under the threshold', async () => {
        const router = new SmartRouter<RouteEntry>({ threshold: 5 });
        const app = new App({ router });
        for (let i = 0; i < 3; i++) {
            app.get(`/r${i}`, defineCoreHandler(() => `r${i}`));
        }

        // First fetch triggers the choice.
        const res = await app.fetch(createTestRequest('/r0'));
        expect(await res.text()).toBe('r0');
        expect(inner(router)).toBeInstanceOf(LinearRouter);
    });

    it('picks TrieRouter at or above the threshold', async () => {
        const router = new SmartRouter<RouteEntry>({ threshold: 5 });
        const app = new App({ router });
        for (let i = 0; i < 5; i++) {
            app.get(`/r${i}`, defineCoreHandler(() => `r${i}`));
        }

        const res = await app.fetch(createTestRequest('/r0'));
        expect(await res.text()).toBe('r0');
        expect(inner(router)).toBeInstanceOf(TrieRouter);
    });

    it('forwards routes registered after the first lookup to the chosen inner', async () => {
        const router = new SmartRouter<RouteEntry>({ threshold: 5 });
        const app = new App({ router });
        app.get('/before', defineCoreHandler(() => 'before'));

        // First lookup → SmartRouter commits to LinearRouter.
        expect(await (await app.fetch(createTestRequest('/before'))).text()).toBe('before');

        // Late registration goes straight to the inner.
        app.get('/after', defineCoreHandler(() => 'after'));
        expect(await (await app.fetch(createTestRequest('/after'))).text()).toBe('after');
    });

    it('uses the configured cache on the chosen inner router', async () => {
        // Track whether `set` was called on the user-supplied cache —
        // proves the cache reference was handed off to the inner
        // router (which is the only thing that calls `set`).
        let setCalls = 0;
        const cache = new LruCache<readonly any[]>();
        const originalSet = cache.set.bind(cache);
        cache.set = (k, v) => { setCalls++; originalSet(k, v); };

        const router = new SmartRouter<RouteEntry>({ threshold: 3, cache });
        const app = new App({ router });
        for (let i = 0; i < 3; i++) {
            app.get(`/r${i}`, defineCoreHandler(() => `r${i}`));
        }

        await app.fetch(createTestRequest('/r0'));
        expect(setCalls).toBeGreaterThan(0);
    });

    it('clone() returns a fresh, uncommitted SmartRouter', () => {
        const router = new SmartRouter<RouteEntry>({ threshold: 5 });
        router.add({
            path: '/x',
            method: 'GET',
            data: { type: 'handler', dummy: true } as never,
        });
        // Force the original to choose its inner.
        router.lookup('/x', 'GET');
        expect(inner(router)).toBeDefined();

        const cloned = router.clone() as SmartRouter<RouteEntry>;
        // Clone hasn't decided yet — no inner until something
        // triggers a lookup, and routes from the original do NOT
        // carry over (matches LinearRouter / TrieRouter clone
        // semantics).
        expect(inner(cloned)).toBeUndefined();
        expect(cloned.lookup('/x', 'GET').length).toBe(0);
    });

    it('default threshold defers to TrieRouter at 30+ entries', async () => {
        const router = new SmartRouter<RouteEntry>();
        const app = new App({ router });
        for (let i = 0; i < 30; i++) {
            app.get(`/r${i}`, defineCoreHandler(() => `r${i}`));
        }
        await app.fetch(createTestRequest('/r0'));
        expect(inner(router)).toBeInstanceOf(TrieRouter);
    });

    it('serves correctly when no routes are registered (empty pending)', async () => {
        const router = new SmartRouter<RouteEntry>();
        const app = new App({ router });
        const res = await app.fetch(createTestRequest('/anything'));
        expect(res.status).toBe(404);
    });
});
