import supertest from 'supertest';
import {
    HeaderName, Router, createNodeDispatcher, defineHandler,
} from '../../../src';

describe('src/router', () => {
    it('should not send etag', async () => {
        const router = new Router({
            etag: false,
        });

        router.get('/', defineHandler(() => 'Hello world!'));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.headers[HeaderName.ETag]).toBeUndefined();
        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello world!');
    });
});
