import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler } from '../../../src';
import { createTestRequest } from '../../helpers';

describe('routing/paths', () => {
    it('should handle path', async () => {
        const router = new App();

        router.get('/foo', defineCoreHandler(async () => '/foo'));
        router.get('/foo/bar/baz', defineCoreHandler(async () => '/foo/bar/baz'));

        let response = await router.fetch(createTestRequest('/foo'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo');

        response = await router.fetch(createTestRequest('/foo/bar/baz'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo/bar/baz');
    });

    it('should prepend AppOptions.path to every registered entry', async () => {
        const router = new App({ path: '/api' });
        router.get('/users', defineCoreHandler(() => 'users'));
        router.get('/users/:id', defineCoreHandler((event) => `user-${event.params.id}`));

        const list = await router.fetch(createTestRequest('/api/users'));
        expect(await list.text()).toEqual('users');

        const item = await router.fetch(createTestRequest('/api/users/42'));
        expect(await item.text()).toEqual('user-42');

        // Unprefixed paths should not match.
        const miss = await router.fetch(createTestRequest('/users'));
        expect(miss.status).toEqual(404);
    });

    it('should compose AppOptions.path with explicit child mounts', async () => {
        const inner = new App();
        inner.get('/list', defineCoreHandler(() => 'list'));

        const outer = new App({ path: '/api' });
        outer.use('/v1', inner);

        const ok = await outer.fetch(createTestRequest('/api/v1/list'));
        expect(await ok.text()).toEqual('list');
    });

    it('should bind a router under a mount path via use()', async () => {
        const inner = new App();
        inner.get('/bar', defineCoreHandler(() => '/foo/bar'));

        const router = new App();
        router.use('/foo', inner);

        const response = await router.fetch(createTestRequest('/foo/bar'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo/bar');
    });

    it('should handle path for nested routers', async () => {
        const child = new App();
        child.get('/baz', defineCoreHandler(() => '/foo/bar/baz'));

        const middle = new App();
        middle.use('/bar', child);

        const router = new App();
        router.use('/foo', middle);

        const response = await router.fetch(createTestRequest('/foo/bar/baz'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo/bar/baz');
    });

    it('should handle named parameters', async () => {
        const router = new App();

        router.get('/users/:id', defineCoreHandler((event) => ({ id: event.params.id })));

        const response = await router.fetch(createTestRequest('/users/42'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ id: '42' });
    });

    it('should handle multiple named parameters', async () => {
        const router = new App();

        router.get('/users/:id/roles/:roleId', defineCoreHandler((event) => ({
            id: event.params.id,
            roleId: event.params.roleId,
        })));

        const response = await router.fetch(createTestRequest('/users/1/roles/admin'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ id: '1', roleId: 'admin' });
    });

    it('should handle wildcard parameters', async () => {
        const router = new App();

        router.get('/files/{*path}', defineCoreHandler((event) => ({ path: event.params.path })));

        const response = await router.fetch(createTestRequest('/files/a/b/c'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ path: 'a/b/c' });
    });

    it('should handle optional parameters with value', async () => {
        const router = new App();

        router.get('/users{/:id}', defineCoreHandler((event) => ({ id: event.params.id || 'none' })));

        const response = await router.fetch(createTestRequest('/users/123'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ id: '123' });
    });

    it('should handle optional parameters without value', async () => {
        const router = new App();

        router.get('/users{/:id}', defineCoreHandler((event) => ({ id: event.params.id || 'none' })));

        const response = await router.fetch(createTestRequest('/users'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ id: 'none' });
    });
});
