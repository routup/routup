import supertest from 'supertest';
import { send, useRequestMountPath } from '../../../src';
import { createHandler } from '../../handler';

describe('src/helpers/request/query', () => {
    it('should get mount path', async () => {
        const server = supertest(createHandler((req, res) => send(res, useRequestMountPath(req))));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('/');
    });
});
