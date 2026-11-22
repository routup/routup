import { describe, expect, it } from 'vitest';
import {
    App,
    LinearRouter,
    SmartRouter,
    TrieRouter,
    defineCoreHandler,
} from '../../../src';
import type { Handler, IRouter  } from '../../../src';
import { createTestRequest } from '../../helpers';

type ResolverFactory = () => IRouter<Handler>;

const resolvers: Record<string, ResolverFactory> = {
    linear: () => new LinearRouter<Handler>(),
    trie: () => new TrieRouter<Handler>(),
    'smart (linear delegate)': () => new SmartRouter<Handler>(),
    'smart (trie delegate)': () => new SmartRouter<Handler>({ threshold: 0 }),
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

    it('matches static segments case-sensitively', async () => {
        const router = new App({ router: factory() });

        router.get('/admin/:id', defineCoreHandler(() => 'admin'));

        expect((await router.fetch(createTestRequest('/ADMIN/1'))).status).toBe(404);
        expect((await router.fetch(createTestRequest('/admin/1'))).status).toBe(200);
    });

    it('does not run a prefix middleware for a differently cased path', async () => {
        const router = new App({ router: factory() });
        let ran = false;

        router.use('/admin', defineCoreHandler((event) => {
            ran = true;

            return event.next();
        }));

        await router.fetch(createTestRequest('/Admin'));

        expect(ran).toBe(false);
    });

    it('keeps the case of param values', async () => {
        const router = new App({ router: factory() });

        router.get('/users/:id', defineCoreHandler((event) => event.params.id));

        const res = await router.fetch(createTestRequest('/users/AbC'));

        expect(await res.text()).toBe('AbC');
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

    describe('empty path segments (#1012)', () => {
        const guarded = () => {
            const router = new App({ router: factory() });
            const guard: string[] = [];

            router.use('/api/admin', defineCoreHandler((event) => {
                guard.push(event.path);

                return event.next();
            }));
            router.get('/api/admin', defineCoreHandler(() => 'admin'));

            return { router, guard };
        };

        it.each([
            ['/api//admin', 404, false],
            ['//api/admin', 404, false],
            ['/api/admin/', 200, true],
            ['/api/admin//', 404, true],
        ])('answers %s with %i for a guarded route', async (path, status, guardRan) => {
            const { router, guard } = guarded();

            const res = await router.fetch(createTestRequest(path));

            expect(res.status).toBe(status);
            expect(guard.length > 0).toBe(guardRan);
        });

        it.each([
            ['/api//admin', 404],
            ['//api/admin', 404],
            ['/api/admin/', 200],
            ['/api/admin//', 200],
        ])('answers %s with %i for a prefix mount alone', async (path, status) => {
            const router = new App({ router: factory() });

            router.use('/api/admin', defineCoreHandler(() => 'guard'));

            expect((await router.fetch(createTestRequest(path))).status).toBe(status);
        });

        it('answers an empty segment inside a mounted child App with 404', async () => {
            const router = new App({ router: factory() });
            const child = new App();

            child.get('/admin', defineCoreHandler(() => 'x-admin'));
            router.use('/x', child);

            expect((await router.fetch(createTestRequest('/x//admin'))).status).toBe(404);
            expect((await router.fetch(createTestRequest('/x/admin'))).status).toBe(200);
        });

        it.each([
            ['/users//1', 404],
            ['/users/1//', 404],
            ['/users//', 404],
            ['/users/1/', 200],
        ])('answers %s with %i for a param route', async (path, status) => {
            const router = new App({ router: factory() });

            router.get('/users/:id', defineCoreHandler((event) => `user-${event.params.id}`));

            expect((await router.fetch(createTestRequest(path))).status).toBe(status);
        });

        it('answers // with 404 for the root route', async () => {
            const router = new App({ router: factory() });

            router.get('/', defineCoreHandler(() => 'root'));

            expect((await router.fetch(createTestRequest('//'))).status).toBe(404);
            expect((await router.fetch(createTestRequest('/'))).status).toBe(200);
        });

        it('keeps an empty segment inside a splat value', async () => {
            const router = new App({ router: factory() });

            router.get('/files/*path', defineCoreHandler((event) => String(event.params.path)));

            expect(await (await router.fetch(createTestRequest('/files//a'))).text()).toBe('/a');
            expect(await (await router.fetch(createTestRequest('/files/a//b'))).text()).toBe('a//b');
        });
    });
});
