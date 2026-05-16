import { describe, expect, it } from 'vitest';
import {
    App,
    defineCoreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

/**
 * `parent.use(path, child)` snapshots `child._routes` at call time
 * and prefixes them onto the parent's router. The child app is
 * discarded post-flatten — late mutations on `child` do NOT
 * propagate. This mirrors Hono's `app.route(...)` semantics.
 */
describe('App.use — flatten-on-use', () => {
    it('snapshots child routes at mount time (late additions do NOT propagate)', async () => {
        const child = new App();
        child.get('/early', defineCoreHandler(() => 'early'));

        const parent = new App();
        parent.use('/api', child);

        // Registered AFTER the parent.use snapshot — must NOT appear
        // on the parent.
        child.get('/late', defineCoreHandler(() => 'late'));

        expect((await parent.fetch(createTestRequest('/api/early'))).status).toBe(200);
        expect((await parent.fetch(createTestRequest('/api/late'))).status).toBe(404);
    });

    it('merges child plugin registry into the parent at mount time', async () => {
        const child = new App();
        child.use({
            name: 'child-plug',
            version: '2.1.0',
            install: (_app) => {},
        });

        const parent = new App();
        parent.use(child);

        expect(parent.hasPlugin('child-plug')).toBe(true);
        expect(parent.getPluginVersion('child-plug')).toBe('2.1.0');
    });

    it('prefixes the mount path onto every flattened route', async () => {
        const child = new App();
        child.get('/users', defineCoreHandler(() => 'users'));
        child.get('/posts/:id', defineCoreHandler((event) => `post-${event.params.id}`));

        const parent = new App();
        parent.use('/api/v2', child);

        expect(await (await parent.fetch(createTestRequest('/api/v2/users'))).text()).toBe('users');
        expect(await (await parent.fetch(createTestRequest('/api/v2/posts/42'))).text()).toBe('post-42');
    });

    it('mounting a child without a path flattens its routes verbatim onto the parent', async () => {
        const child = new App();
        child.get('/health', defineCoreHandler(() => 'ok'));

        const parent = new App();
        parent.use(child);

        expect(await (await parent.fetch(createTestRequest('/health'))).text()).toBe('ok');
    });

    it('two siblings flattened at different paths each get their own prefix', async () => {
        const a = new App();
        a.get('/x', defineCoreHandler(() => 'a-x'));

        const b = new App();
        b.get('/x', defineCoreHandler(() => 'b-x'));

        const parent = new App();
        parent.use('/a', a);
        parent.use('/b', b);

        expect(await (await parent.fetch(createTestRequest('/a/x'))).text()).toBe('a-x');
        expect(await (await parent.fetch(createTestRequest('/b/x'))).text()).toBe('b-x');
    });
});
