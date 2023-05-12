/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { createHandler, stringify } from '@routup/query';
import { Router } from 'routup';
import supertest from 'supertest';
import { mountController } from '../../src';
import { QueryController } from '../data/query';

describe('src/decorator', () => {
    it('should handle query decorator', async () => {
        const router = new Router();

        router.use(createHandler());

        mountController(router, QueryController);

        const server = supertest(router.createListener());

        const query = {
            foo: 'bar',
        };

        let response = await server
            .get(`/query/many?${stringify(query)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });

        response = await server
            .get(`/query/single?${stringify(query)}`);

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });
});
