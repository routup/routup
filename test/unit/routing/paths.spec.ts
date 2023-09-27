import supertest from 'supertest';
import {
    Router, coreHandler, createNodeDispatcher, useRequestPath,
} from '../../../src';

describe('routing/paths', () => {
    it('should handle path', async () => {
        const router = new Router();

        router.get('/foo', coreHandler(async () => '/foo'));
        router.get('/foo/bar/baz', coreHandler(async () => '/foo/bar/baz'));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/foo');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('/foo');

        response = await server
            .get('/foo/bar/baz');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('/foo/bar/baz');
    });

    it('should handle path by mount path', async () => {
        const router = new Router({
            path: '/foo',
        });

        router.get('/bar', coreHandler(() => '/foo/bar'));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/foo/bar');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('/foo/bar');
    });

    it('should handle path for nested routers', async () => {
        const child = new Router({ path: '/bar' });

        child.get('/baz', coreHandler(() => '/foo/bar/baz'));

        const router = new Router({ path: '/foo' });
        router.use(child);

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/foo/bar/baz');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('/foo/bar/baz');
    });

    it('should handle regexp paths', async () => {
        const router = new Router();

        router.get(/.*fly$/, coreHandler((req) => useRequestPath(req)));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/butterfly');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('/butterfly');

        response = await server
            .get('/dragonfly');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('/dragonfly');

        response = await server
            .get('/dragonflyman');

        expect(response.statusCode).toEqual(404);
    });
});
