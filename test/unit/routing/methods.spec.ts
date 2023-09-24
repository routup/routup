import supertest from 'supertest';
import {
    HeaderName, Router, createNodeDispatcher,
} from '../../../src';

describe('routing/methods', () => {
    it('should handle different methods', async () => {
        const router = new Router();

        router.delete('/delete', async () => 'delete');
        router.get('/get', async () => 'get');
        router.patch('/patch', async () => 'patch');
        router.post('/post', async () => 'post');
        router.put('/put', async () => 'put');
        router.head('/head', async () => null);
        router.options('/options', async () => 'options');

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

    it('should handle different methods on same path', async () => {
        const router = new Router();

        router.delete('/', async () => 'delete');
        router.get('/', async () => 'get');
        router.patch('/', async () => 'patch');
        router.post('/', async () => 'post');
        router.put('/', async () => 'put');

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
