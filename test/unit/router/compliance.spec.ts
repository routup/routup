import { describe, expect, it } from 'vitest';
import {
    App,
    LinearRouter,
    SmartRouter,
    TrieRouter,
    defineCoreHandler,
} from '../../../src';
import type { Handler, IAppEvent, IRouter  } from '../../../src';
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

    describe('wildcards and trailing slashes (#1013)', () => {
        // the params the handler sees, and the prefix its route consumed
        const describeEvent = (event: IAppEvent) => `${JSON.stringify({ ...event.params })} ${event.mountPath}`;

        const setups: Record<string, (app: App) => void> = {
            'get /files/*path': (app) => {
                app.get('/files/*path', defineCoreHandler(describeEvent));
            },
            'get /files{/*path}': (app) => {
                app.get('/files{/*path}', defineCoreHandler(describeEvent));
            },
            'get {/*rest}': (app) => {
                app.get('{/*rest}', defineCoreHandler(describeEvent));
            },
            'get {/:id}': (app) => {
                app.get('{/:id}', defineCoreHandler(describeEvent));
            },
            'use {/*rest}': (app) => {
                app.use('{/*rest}', defineCoreHandler(describeEvent));
            },
            'child App at /x with get {/*rest}': (app) => {
                const child = new App();

                child.get('{/*rest}', defineCoreHandler(describeEvent));
                app.use('/x', child);
            },
            'handler with path {/*rest} at /x': (app) => {
                app.use('/x', defineCoreHandler({
                    path: '{/*rest}',
                    method: 'GET',
                    fn: describeEvent,
                }));
            },
            'child App at / with get {/*rest}': (app) => {
                const child = new App();

                child.get('{/*rest}', defineCoreHandler(describeEvent));
                app.use('/', child);
            },
            'child App at /x/ with get {/*rest}': (app) => {
                const child = new App();

                child.get('{/*rest}', defineCoreHandler(describeEvent));
                app.use('/x/', child);
            },
            'child App at {/*rest} with get /users': (app) => {
                const child = new App();

                child.get('/users', defineCoreHandler(describeEvent));
                app.use('{/*rest}', child);
            },
            'get {users}': (app) => {
                app.get('{users}', defineCoreHandler(describeEvent));
            },
            'child App at /x with get {users}': (app) => {
                const child = new App();

                child.get('{users}', defineCoreHandler(describeEvent));
                app.use('/x', child);
            },
            'use /files/*path': (app) => {
                app.use('/files/*path', defineCoreHandler(describeEvent));
            },
            'get /a/:b/*c': (app) => {
                app.get('/a/:b/*c', defineCoreHandler(describeEvent));
            },
            'use /api/admin': (app) => {
                app.use('/api/admin', defineCoreHandler(describeEvent));
            },
            'use /users/:id': (app) => {
                app.use('/users/:id', defineCoreHandler(describeEvent));
            },
            'get /users/:id': (app) => {
                app.get('/users/:id', defineCoreHandler(describeEvent));
            },
            'get /users{/:id}': (app) => {
                app.get('/users{/:id}', defineCoreHandler(describeEvent));
            },
            'get /users': (app) => {
                app.get('/users', defineCoreHandler(describeEvent));
            },
            'child App at /x with use()': (app) => {
                const child = new App();

                child.use(defineCoreHandler(describeEvent));
                app.use('/x', child);
            },
            'child App at /x with get /files/*path': (app) => {
                const child = new App();

                child.get('/files/*path', defineCoreHandler(describeEvent));
                app.use('/x', child);
            },
            'use /files{/*path}': (app) => {
                app.use('/files{/*path}', defineCoreHandler(describeEvent));
            },
            'child App at /files{/*path} with use()': (app) => {
                const child = new App();

                child.use(defineCoreHandler(describeEvent));
                app.use('/files{/*path}', child);
            },
            'child App at /files{/*path} with get /meta': (app) => {
                const child = new App();

                child.get('/meta', defineCoreHandler(describeEvent));
                app.use('/files{/*path}', child);
            },
            'use /api{/:v}': (app) => {
                app.use('/api{/:v}', defineCoreHandler(describeEvent));
            },
            'child App at /api{/:v} with get /items': (app) => {
                const child = new App();

                child.get('/items', defineCoreHandler(describeEvent));
                app.use('/api{/:v}', child);
            },
            'nested child Apps at /x and /files{/*path}': (app) => {
                const inner = new App();

                inner.use(defineCoreHandler(describeEvent));

                const middle = new App();

                middle.use('/files{/*path}', inner);
                app.use('/x', middle);
            },
            'child App at /x with use /files': (app) => {
                const child = new App();

                child.use('/files', defineCoreHandler(describeEvent));
                app.use('/x', child);
            },
        };

        it.each([
            ['get /files/*path', '/files', 404],
            ['get /files/*path', '/files/', 404],
            ['get /files/*path', '/files/a', '{"path":"a"} /files/a'],
            ['get /files/*path', '/files/a/', '{"path":"a/"} /files/a/'],
            ['get /files/*path', '/files/a/b/', '{"path":"a/b/"} /files/a/b/'],
            ['get /files/*path', '/files//a', '{"path":"/a"} /files//a'],
            ['get /files/*path', '/files//', '{"path":"/"} /files//'],
            ['get /files/*path', '/files/a//', '{"path":"a//"} /files/a//'],
            ['get /files/*path', '/files///', '{"path":"//"} /files///'],
            ['get /files{/*path}', '/files', '{} /files'],
            ['get /files{/*path}', '/files/', '{} /files/'],
            ['get /files{/*path}', '/files/a', '{"path":"a"} /files/a'],
            ['get /files{/*path}', '/files/a/', '{"path":"a/"} /files/a/'],
            ['get /files{/*path}', '/files//', '{"path":"/"} /files//'],
            ['use /files/*path', '/files', 404],
            ['use /files/*path', '/files/', 404],
            ['use /files/*path', '/files/a/', '{"path":"a/"} /files/a/'],
            ['get /a/:b/*c', '/a/1', 404],
            ['get /a/:b/*c', '/a/1/', 404],
            ['get /a/:b/*c', '/a/1/x/', '{"b":"1","c":"x/"} /a/1/x/'],
            ['use /api/admin', '/api/admin', '{} /api/admin'],
            ['use /api/admin', '/api/admin/', '{} /api/admin/'],
            ['use /api/admin', '/api/admin//', '{} /api/admin'],
            ['use /api/admin', '/api/admin/x/', '{} /api/admin'],
            ['use /users/:id', '/users/1/', '{"id":"1"} /users/1/'],
            ['use /users/:id', '/users/1//', '{"id":"1"} /users/1'],
            ['get /users/:id', '/users/1/', '{"id":"1"} /users/1/'],
            ['get /users{/:id}', '/users', '{} /users'],
            ['get /users{/:id}', '/users/', '{} /users/'],
            ['get /users{/:id}', '/users/1/', '{"id":"1"} /users/1/'],
            ['get /users{/:id}', '/users//', 404],
            ['get /users', '/users/', '{} /users/'],
            ['child App at /x with use()', '/x/', '{} /x/'],
            ['child App at /x with use()', '/x//', '{} /x'],
            ['child App at /x with get /files/*path', '/x/files', 404],
            ['child App at /x with get /files/*path', '/x/files/', 404],
            ['child App at /x with get /files/*path', '/x/files/a/', '{"path":"a/"} /x/files/a/'],
            ['child App at /x with use /files', '/x/files/', '{} /x/files/'],
            ['child App at /x with use /files', '/x/files/a/', '{} /x/files'],
            ['use /files{/*path}', '/files', '{} /files'],
            ['use /files{/*path}', '/files/', '{} /files/'],
            ['use /files{/*path}', '/files/a', '{"path":"a"} /files/a'],
            ['use /files{/*path}', '/files/a/', '{"path":"a/"} /files/a/'],
            ['use /files{/*path}', '/files/a/b', '{"path":"a/b"} /files/a/b'],
            ['child App at /files{/*path} with use()', '/files', '{} /files'],
            ['child App at /files{/*path} with use()', '/files/a/b', '{"path":"a/b"} /files/a/b'],
            ['child App at /files{/*path} with get /meta', '/files/meta', '{} /files/meta'],
            ['child App at /files{/*path} with get /meta', '/files/a/meta', '{"path":"a"} /files/a/meta'],
            ['get /files{/*path}', '/files/a/b', '{"path":"a/b"} /files/a/b'],
            ['use /api{/:v}', '/api', '{} /api'],
            ['use /api{/:v}', '/api/v1', '{"v":"v1"} /api/v1'],
            ['use /api{/:v}', '/api/v1/x', '{"v":"v1"} /api/v1'],
            ['child App at /api{/:v} with get /items', '/api/items', '{} /api/items'],
            ['child App at /api{/:v} with get /items', '/api/v1/items', '{"v":"v1"} /api/v1/items'],
            ['nested child Apps at /x and /files{/*path}', '/x/files', '{} /x/files'],
            ['nested child Apps at /x and /files{/*path}', '/x/files/a/', '{"path":"a/"} /x/files/a/'],
            // a leading optional group means zero or more segments (#1014)
            ['get {/*rest}', '/', '{} /'],
            ['get {/*rest}', '/users', '{"rest":"users"} /users'],
            ['get {/*rest}', '/a/b/', '{"rest":"a/b/"} /a/b/'],
            ['get {/:id}', '/', '{} /'],
            ['get {/:id}', '/1', '{"id":"1"} /1'],
            ['get {/:id}', '/1/2', 404],
            ['use {/*rest}', '/', '{} /'],
            ['use {/*rest}', '/a/b', '{"rest":"a/b"} /a/b'],
            ['child App at /x with get {/*rest}', '/x', '{} /x'],
            ['child App at /x with get {/*rest}', '/x/y', '{"rest":"y"} /x/y'],
            ['child App at /x with get {/*rest}', '/xy', 404],
            ['handler with path {/*rest} at /x', '/x', '{} /x'],
            ['handler with path {/*rest} at /x', '/x/y', '{"rest":"y"} /x/y'],
            ['child App at / with get {/*rest}', '/a/b', '{"rest":"a/b"} /a/b'],
            ['child App at /x/ with get {/*rest}', '/x', '{} /x'],
            ['child App at /x/ with get {/*rest}', '/x/y', '{"rest":"y"} /x/y'],
            ['child App at {/*rest} with get /users', '/users', '{} /users'],
            ['child App at {/*rest} with get /users', '/a/users', '{"rest":"a"} /a/users'],
            // a group without its own slash keeps the prepended one
            ['get {users}', '/', '{} /'],
            ['get {users}', '/users', '{} /users'],
            ['child App at /x with get {users}', '/x/users', '{} /x/users'],
            ['child App at /x with get {users}', '/xusers', 404],
        ] as const)('%s answers %s with %s', async (setup, path, expected) => {
            const router = new App({ router: factory() });

            setups[setup]!(router);

            const res = await router.fetch(createTestRequest(path));

            if (typeof expected === 'number') {
                expect(res.status).toBe(expected);
            } else {
                expect(res.status).toBe(200);
                expect(await res.text()).toBe(expected);
            }
        });
    });

    describe('unsupported path syntax', () => {
        it.each([
            ['a bare wildcard', '/files/*'],
            ['an optional param with ?', '/users/:id?'],
        ])('throws at registration for %s (%s)', (_, path) => {
            const router = new App({ router: factory() });

            expect(() => router.get(path, defineCoreHandler(() => 'x'))).toThrow(TypeError);
        });

        it('keeps the routes registered before and after a rejected one', async () => {
            const router = new App({ router: factory() });

            router.get('/a', defineCoreHandler(() => 'a'));

            try {
                router.get('/files/*', defineCoreHandler(() => 'files'));
            } catch {
                // rejected
            }

            router.get('/b', defineCoreHandler(() => 'b'));

            expect(await (await router.fetch(createTestRequest('/a'))).text()).toBe('a');
            expect(await (await router.fetch(createTestRequest('/b'))).text()).toBe('b');
            expect((await router.fetch(createTestRequest('/files/x'))).status).toBe(404);
        });
    });
});
