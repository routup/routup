import supertest from 'supertest';
import {
    Router, createNodeListener, send, useRequestParams,
} from '../../../src';

describe('src/module', () => {
    it('should process async & sync handler', async () => {
        const router = new Router();

        router.get('/async', async (req, res) => new Promise((resolve) => {
            setTimeout(() => resolve('foo'), 0);
        }));

        router.get('/sync', () => 'bar');

        const server = supertest(createNodeListener(router));

        let response = await server
            .get('/async');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('foo');

        response = await server
            .get('/sync');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });

    it('should process dynamic path', async () => {
        const router = new Router();

        router.get('/param/:id', async (req, res) => {
            const params = useRequestParams(req);

            send(res, params.id);
        });

        const server = supertest(createNodeListener(router));

        const response = await server
            .get('/param/abc');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('abc');
    });

    it('should process with no matching route', async () => {
        const router = new Router();

        router.get('/param/:id', async (req, res) => {
            send(res, 'foo');
        });

        const server = supertest(createNodeListener(router));

        const response = await server
            .get('/foo');

        expect(response.statusCode).toEqual(404);
    });

    it('should process with missing response', async () => {
        const router = new Router({
            timeout: 100,
        });

        router.get('/', async () => {});

        const server = supertest(createNodeListener(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(504);
    });

    it('should process with error thrown', async () => {
        const router = new Router();

        router.get('/', () => {
            throw new Error('foo');
        });

        const server = supertest(createNodeListener(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(500);
    });

    it('should process with async error thrown', async () => {
        const router = new Router();

        router.get('/', async () => {
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('bar'));
                }, 0);
            });
        });

        const server = supertest(createNodeListener(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(500);
    });
});
