import supertest from 'supertest';
import { HeaderName, Router, createNodeDispatcher } from '../../../src';

describe('src/helpers/response/send-web-blob', () => {
    it('should send', async () => {
        const router = new Router();

        router.get('/', () => new Blob(
            ['<q id="a"><span id="b">hey!</span></q>'],
            {
                type: 'text/html',
            },
        ));

        const server = supertest(createNodeDispatcher(router));

        const response = await server.get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html');
        expect(response.text).toEqual('<q id="a"><span id="b">hey!</span></q>');
    });
});
