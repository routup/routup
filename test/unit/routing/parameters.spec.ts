/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from 'supertest';
import { Router, send, useRequestParams } from '../../../src';

describe('routing/parameters', () => {
    it('should capture parameters', async () => {
        const router = new Router();

        router.get('/:id/:action', async (req, res) => {
            send(res, useRequestParams(req));
        });

        const server = supertest(router.createListener());

        const response = await server
            .get('/123/run');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ id: '123', action: 'run' });
    });

    it('should pass on captured parameters', async () => {
        const router = new Router({
            path: '/:id',
        });

        router.get('/:action', async (req, res) => {
            send(res, useRequestParams(req));
        });

        const server = supertest(router.createListener());

        const response = await server
            .get('/123/run');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ id: '123', action: 'run' });
    });
});
