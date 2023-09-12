import supertest from 'supertest';
import { Router, createNodeListener } from '../../../src';

describe('src/helpers/response/send-web-response', () => {
    it('should send', async () => {
        const router = new Router();

        router.get('/', () => new Response(null, {
            status: 210,
            headers: {
                foo: 'bar',
            },
        }));

        const server = supertest(createNodeListener(router));

        const response = await server.get('/');

        expect(response.statusCode).toEqual(210);
        expect(response.text).toEqual('');
        expect(response.headers.foo).toEqual('bar');
    });
});
