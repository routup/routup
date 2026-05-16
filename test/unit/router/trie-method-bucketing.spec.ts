import { describe, expect, it } from 'vitest';
import {
    App,
    LruCache,
    TrieRouter,
    defineCoreHandler,
} from '../../../src';
import type { Handler } from '../../../src';
import { createTestRequest } from '../../helpers';

/**
 * T4 — per-node method bucketing on TrieRouter.
 *
 * Each leaf node now stores its exact-match and splat-terminated
 * routes in `Record<method, IndexedRoute[]>` instead of a flat
 * list. Lookup emits only the relevant buckets for the request
 * method (`'' | <method>` for normal requests; `'' | HEAD | GET`
 * for HEAD; every bucket for OPTIONS so `event.methodsAllowed`
 * still populates).
 *
 * Middleware (`prefixRoutes`) stays method-agnostic.
 */
describe('TrieRouter — method bucketing (T4)', () => {
    it('same path, different methods: each fires only its handler', async () => {
        const app = new App({ router: new TrieRouter<Handler>() });
        app.get('/users', defineCoreHandler(() => 'list'));
        app.post('/users', defineCoreHandler(() => 'created'));

        const get = await app.fetch(createTestRequest('/users'));
        expect(await get.text()).toBe('list');

        const post = await app.fetch(createTestRequest('/users', { method: 'POST' }));
        expect(await post.text()).toBe('created');
    });

    it('middleware fires for both methods at the same path', async () => {
        const app = new App({ router: new TrieRouter<Handler>() });
        const fired: string[] = [];

        app.use('/users', defineCoreHandler(async (event) => {
            fired.push(event.method);
            return event.next();
        }));
        app.get('/users', defineCoreHandler(() => 'list'));
        app.post('/users', defineCoreHandler(() => 'created'));

        await app.fetch(createTestRequest('/users'));
        await app.fetch(createTestRequest('/users', { method: 'POST' }));

        expect(fired).toEqual(['GET', 'POST']);
    });

    it('OPTIONS sees every registered method (auto-Allow header)', async () => {
        const app = new App({ router: new TrieRouter<Handler>() });
        app.get('/items', defineCoreHandler(() => 'list'));
        app.post('/items', defineCoreHandler(() => 'created'));
        app.delete('/items', defineCoreHandler(() => 'deleted'));

        const res = await app.fetch(createTestRequest('/items', { method: 'OPTIONS' }));
        expect(res.status).toBe(200);
        const allow = (res.headers.get('allow') ?? '').split(',').map((s) => s.trim()).sort();
        // HEAD is implicitly allowed when GET is present. OPTIONS
        // itself isn't included in the Allow header (matches the
        // existing OPTIONS auto-Allow behaviour in methods.spec.ts).
        expect(allow).toEqual(['DELETE', 'GET', 'HEAD', 'POST']);
    });

    it('HEAD falls through to a GET handler', async () => {
        const app = new App({ router: new TrieRouter<Handler>() });
        app.get('/users', defineCoreHandler(() => 'list'));

        const res = await app.fetch(createTestRequest('/users', { method: 'HEAD' }));
        expect(res.status).toBe(200);
    });

    it('splat with method binding only fires for that method', async () => {
        // Named splat (`*rest`) — bare `*` isn't accepted by
        // path-to-regexp v8, but the trie still buckets named splats
        // per method. This catches the per-bucket emission for
        // `splatRoutes`.
        const app = new App({ router: new TrieRouter<Handler>() });
        app.get('/files/*rest', defineCoreHandler(() => 'get-files'));
        app.post('/files/*rest', defineCoreHandler(() => 'post-files'));

        expect(await (await app.fetch(createTestRequest('/files/a/b'))).text()).toBe('get-files');
        expect(await (await app.fetch(createTestRequest('/files/a/b', { method: 'POST' }))).text())
            .toBe('post-files');
    });

    it('cache differentiates entries per method', async () => {
        // With the cache enabled, GET /users and POST /users must
        // not share a cached candidate set — they would emit
        // different handler buckets after T4.
        const app = new App({ router: new TrieRouter<Handler>({ cache: new LruCache() }) });
        app.get('/users', defineCoreHandler(() => 'list'));
        app.post('/users', defineCoreHandler(() => 'created'));

        // First call warms the cache for GET.
        expect(await (await app.fetch(createTestRequest('/users'))).text()).toBe('list');
        // POST must NOT pick up the cached GET match.
        expect(await (await app.fetch(createTestRequest('/users', { method: 'POST' }))).text())
            .toBe('created');
    });
});
