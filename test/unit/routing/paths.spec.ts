import { describe, expect, it } from 'vitest';
import { Router, coreHandler } from '../../../src';
import { createTestRequest } from '../../helpers';

describe('routing/paths', () => {
    it('should handle path', async () => {
        const router = new Router();

        router.get('/foo', coreHandler(async () => '/foo'));
        router.get('/foo/bar/baz', coreHandler(async () => '/foo/bar/baz'));

        let response = await router.fetch(createTestRequest('/foo'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo');

        response = await router.fetch(createTestRequest('/foo/bar/baz'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo/bar/baz');
    });

    it('should handle path by mount path', async () => {
        const router = new Router({ path: '/foo' });

        router.get('/bar', coreHandler(() => '/foo/bar'));

        const response = await router.fetch(createTestRequest('/foo/bar'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo/bar');
    });

    it('should handle path for nested routers', async () => {
        const child = new Router({ path: '/bar' });

        child.get('/baz', coreHandler(() => '/foo/bar/baz'));

        const router = new Router({ path: '/foo' });
        router.use(child);

        const response = await router.fetch(createTestRequest('/foo/bar/baz'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo/bar/baz');
    });
});
