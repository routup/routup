/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import qs from 'qs';
import supertest from 'supertest';
import { Router, send } from 'routup';
import { createHandler, useRequestQuery } from '../../src';

describe('src/module', () => {
    it('should parse request query', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            send(res, useRequestQuery(req));
        });

        router.get('/key', (req, res) => {
            useRequestQuery(req, 'sort');

            send(res, useRequestQuery(req, 'sort'));
        });

        router.get('/reuse', (req, res) => {
            useRequestQuery(req);

            send(res, useRequestQuery(req));
        });

        const server = supertest(router.createListener());

        const query = { page: { limit: '10', offset: '0' }, sort: '-name' };

        let response = await server
            .get(`/?${qs.stringify(query)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(query);

        response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({});

        response = await server
            .get(`/key?${qs.stringify(query)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('-name');

        response = await server
            .get(`/reuse?${qs.stringify(query)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(query);
    });

    it('should parse request query with middleware', async () => {
        const router = new Router();

        router.use(createHandler());

        router.get('/', (req, res) => {
            send(res, useRequestQuery(req));
        });

        const server = supertest(router.createListener());

        const query = { page: { limit: '10', offset: '0' }, sort: '-name' };

        const response = await server
            .get(`/?${qs.stringify(query)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(query);
    });
});
