import supertest from 'supertest';
import {
    HeaderName, Router, coreHandler, createNodeDispatcher,
} from '../../../src';

describe('routing/methods', () => {
    it('should mount lazy handler with use method', async () => {
        const router = new Router();

        router.use('/foo', (_req: any, _res: any, _next: any) => { throw new Error('bar'); });
        router.use((err, _req, _res, _next) => err.message);

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .delete('/foo');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });
    it('should handle different methods', async () => {
        const router = new Router();

        router.delete('/delete', coreHandler(async () => 'delete'));
        router.get('/get', coreHandler(async () => 'get'));
        router.patch('/patch', coreHandler(async () => 'patch'));
        router.post('/post', coreHandler(async () => 'post'));
        router.put('/put', coreHandler(async () => 'put'));
        router.head('/head', coreHandler(async () => null));
        router.options('/options', coreHandler(async () => 'options'));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .delete('/delete');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('delete');

        response = await server
            .get('/get');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('get');

        response = await server
            .patch('/patch');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('patch');

        response = await server
            .post('/post');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('post');

        response = await server
            .put('/put');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('put');

        response = await server
            .head('/head');

        expect(response.statusCode).toEqual(200);

        response = await server
            .options('/options');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('options');
    });

    it('should define global head handler', async () => {
        const router = new Router();
        router.head(coreHandler(async () => 'HEAD'));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .head('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toBeUndefined();
    });

    it('should define global options handler', async () => {
        const router = new Router();
        router.options(coreHandler(async () => 'options'));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .options('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('options');
    });

    it('should handle different methods on same path', async () => {
        const router = new Router();

        router.delete(coreHandler(async () => 'delete'));
        router.get(coreHandler(async () => 'get'));
        router.patch(coreHandler(async () => 'patch'));
        router.post(coreHandler(async () => 'post'));
        router.put(coreHandler(async () => 'put'));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .delete('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('delete');

        response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('get');

        response = await server
            .patch('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('patch');

        response = await server
            .post('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('post');

        response = await server
            .put('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('put');

        response = await server
            .head('/');

        expect(response.statusCode).toEqual(200);

        response = await server
            .options('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.ALLOW]).toEqual('DELETE,GET,PATCH,POST,PUT,HEAD');
        expect(response.text).toEqual('DELETE,GET,PATCH,POST,PUT,HEAD');
    });
});
