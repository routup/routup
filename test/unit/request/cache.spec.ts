import supertest from 'supertest';
import { isRequestCacheable, send } from '../../../src';
import { createRequestListener } from '../../handler';

describe('src/helpers/request/cache', () => {
    it('should be cacheable', async () => {
        const server = supertest(createRequestListener((req, res) => {
            send(res, isRequestCacheable(req, new Date()));
        }));

        const response = await server
            .get('/')
            .set('If-Modified-Since', new Date(Date.now() + 3600).toUTCString());

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('true');
    });

    it('should not be cacheable', async () => {
        const server = supertest(createRequestListener((req, res) => {
            send(res, isRequestCacheable(req, new Date()));
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('false');
    });
});
