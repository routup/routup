import { describe, expect, it } from 'vitest';
import { Router, defineCoreHandler } from '../../../src';
import { createTestRequest } from '../../helpers';

describe('routing/paths', () => {
    it('should handle path', async () => {
        const router = new Router();

        router.get('/foo', defineCoreHandler(async () => '/foo'));
        router.get('/foo/bar/baz', defineCoreHandler(async () => '/foo/bar/baz'));

        let response = await router.fetch(createTestRequest('/foo'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo');

        response = await router.fetch(createTestRequest('/foo/bar/baz'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo/bar/baz');
    });

    it('should handle path by mount path', async () => {
        const router = new Router({ path: '/foo' });

        router.get('/bar', defineCoreHandler(() => '/foo/bar'));

        const response = await router.fetch(createTestRequest('/foo/bar'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo/bar');
    });

    it('should handle path for nested routers', async () => {
        const child = new Router({ path: '/bar' });

        child.get('/baz', defineCoreHandler(() => '/foo/bar/baz'));

        const router = new Router({ path: '/foo' });
        router.use(child);

        const response = await router.fetch(createTestRequest('/foo/bar/baz'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo/bar/baz');
    });

    it('should handle named parameters', async () => {
        const router = new Router();

        router.get('/users/:id', defineCoreHandler((event) => ({ id: event.params.id })));

        const response = await router.fetch(createTestRequest('/users/42'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ id: '42' });
    });

    it('should handle multiple named parameters', async () => {
        const router = new Router();

        router.get('/users/:id/roles/:roleId', defineCoreHandler((event) => ({
            id: event.params.id,
            roleId: event.params.roleId,
        })));

        const response = await router.fetch(createTestRequest('/users/1/roles/admin'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ id: '1', roleId: 'admin' });
    });

    it('should handle wildcard parameters', async () => {
        const router = new Router();

        router.get('/files/{*path}', defineCoreHandler((event) => ({ path: event.params.path })));

        const response = await router.fetch(createTestRequest('/files/a/b/c'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ path: 'a/b/c' });
    });

    it('should handle optional parameters with value', async () => {
        const router = new Router();

        router.get('/users{/:id}', defineCoreHandler((event) => ({ id: event.params.id || 'none' })));

        const response = await router.fetch(createTestRequest('/users/123'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ id: '123' });
    });

    it('should handle optional parameters without value', async () => {
        const router = new Router();

        router.get('/users{/:id}', defineCoreHandler((event) => ({ id: event.params.id || 'none' })));

        const response = await router.fetch(createTestRequest('/users'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ id: 'none' });
    });
});
