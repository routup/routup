import { describe, expect, it } from 'vitest';
import {
    App,
    LinearRouter,
    TrieRouter,
    defineCoreHandler,
} from '../../../src';
import type { IRouter } from '../../../src';
import type { RouteEntry } from '../../../src/app/types';
import { createTestRequest } from '../../helpers';

type ResolverFactory = () => IRouter<RouteEntry>;

const resolvers: Record<string, ResolverFactory> = {
    linear: () => new LinearRouter<RouteEntry>(),
    trie: () => new TrieRouter<RouteEntry>(),
};

describe.each(Object.entries(resolvers))('resolver compliance: %s', (_name, factory) => {
    it('dispatches a simple static GET', async () => {
        const router = new App({ router: factory() });
        router.get('/users', defineCoreHandler(() => 'users-list'));

        const res = await router.fetch(createTestRequest('/users'));
        expect(res.status).toBe(200);
        expect(await res.text()).toBe('users-list');
    });

    it('extracts route params', async () => {
        const router = new App({ router: factory() });
        router.get(
            '/users/:id',
            defineCoreHandler((event) => `user-${event.params.id}`),
        );

        const res = await router.fetch(createTestRequest('/users/42'));
        expect(await res.text()).toBe('user-42');
    });

    it('falls through middleware to a handler', async () => {
        const router = new App({ router: factory() });
        const order: string[] = [];

        router.use(defineCoreHandler(async (event) => {
            order.push('mw');
            return event.next();
        }));
        router.get('/', defineCoreHandler(() => {
            order.push('handler');
            return 'ok';
        }));

        const res = await router.fetch(createTestRequest('/'));
        expect(await res.text()).toBe('ok');
        expect(order).toEqual(['mw', 'handler']);
    });

    it('returns 404 for unmatched paths', async () => {
        const router = new App({ router: factory() });
        router.get('/users', defineCoreHandler(() => 'ok'));

        const res = await router.fetch(createTestRequest('/missing'));
        expect(res.status).toBe(404);
    });

    it('returns matches in registration order', async () => {
        const router = new App({ router: factory() });
        const order: string[] = [];

        router.use(defineCoreHandler(async (event) => {
            order.push('a');
            return event.next();
        }));
        router.use(defineCoreHandler(async (event) => {
            order.push('b');
            return event.next();
        }));
        router.use(defineCoreHandler(async (event) => {
            order.push('c');
            return event.next();
        }));
        router.get('/x', defineCoreHandler(() => {
            order.push('handler');
            return 'ok';
        }));

        await router.fetch(createTestRequest('/x'));
        expect(order).toEqual(['a', 'b', 'c', 'handler']);
    });

    it('dispatches across a mounted child router', async () => {
        const inner = new App({ router: factory() });
        inner.get('/list', defineCoreHandler(() => 'inner-list'));

        const outer = new App({ router: factory() });
        outer.use('/api', inner);

        const res = await outer.fetch(createTestRequest('/api/list'));
        expect(await res.text()).toBe('inner-list');
    });

    it('discriminates by HTTP method', async () => {
        const router = new App({ router: factory() });
        router.get('/r', defineCoreHandler(() => 'get'));
        router.post('/r', defineCoreHandler(() => 'post'));

        const gres = await router.fetch(createTestRequest('/r', { method: 'GET' }));
        const pres = await router.fetch(createTestRequest('/r', { method: 'POST' }));
        expect(await gres.text()).toBe('get');
        expect(await pres.text()).toBe('post');
    });

    it('returns OPTIONS auto-Allow with the registered methods', async () => {
        const router = new App({ router: factory() });
        router.get('/r', defineCoreHandler(() => 'g'));
        router.post('/r', defineCoreHandler(() => 'p'));

        const res = await router.fetch(createTestRequest('/r', { method: 'OPTIONS' }));
        expect(res.status).toBe(200);
        const allow = res.headers.get('allow') ?? '';
        expect(allow).toContain('GET');
        expect(allow).toContain('POST');
        expect(allow).toContain('HEAD');
    });

    it('matches multiple route patterns with shared prefix', async () => {
        const router = new App({ router: factory() });
        router.get('/users/:id', defineCoreHandler((event) => `user-${event.params.id}`));
        router.get('/users/:id/posts', defineCoreHandler((event) => `posts-of-${event.params.id}`));
        router.get('/products', defineCoreHandler(() => 'products'));

        const r1 = await router.fetch(createTestRequest('/users/1'));
        const r2 = await router.fetch(createTestRequest('/users/1/posts'));
        const r3 = await router.fetch(createTestRequest('/products'));

        expect(await r1.text()).toBe('user-1');
        expect(await r2.text()).toBe('posts-of-1');
        expect(await r3.text()).toBe('products');
    });

    it('supports repeated lookups (memoization stability)', async () => {
        const router = new App({ router: factory() });
        router.get('/x', defineCoreHandler(() => 'x'));

        for (let i = 0; i < 3; i++) {
            const res = await router.fetch(createTestRequest('/x'));
            expect(await res.text()).toBe('x');
        }
    });

    it('combines a handler\'s intrinsic path with the mount path', async () => {
        // Verifies that `defineCoreHandler({ path, method, fn })` mounted at
        // a parent path concatenates rather than overrides. Before plan 011
        // the intrinsic path was silently ignored when a mount path was also
        // passed.
        const router = new App({ router: factory() });
        router.get('/users', defineCoreHandler({
            path: '/:id',
            fn: (event) => `user-${event.params.id}`,
        }));

        const res = await router.fetch(createTestRequest('/users/42'));
        expect(await res.text()).toBe('user-42');
    });

    it('clone() returns a fresh empty router of the same shape', () => {
        // IRouter.clone()'s contract: a fresh, **empty** router.
        // Verified observationally — register a route on the original,
        // then ensure the clone returns no matches for it. Avoids
        // depending on `IRouter.routes` (now optional on the
        // contract; not implemented by the built-in routers anymore).
        const router = factory();
        router.add({
            path: '/users',
            method: 'GET',
            data: { type: 'handler', dummy: true } as never,
        });
        expect(router.lookup('/users', 'GET').length).toBeGreaterThan(0);

        const cloned = router.clone();
        expect(cloned.lookup('/users', 'GET').length).toBe(0);
        // Distinct instance.
        expect(cloned).not.toBe(router);
    });
});
