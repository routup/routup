/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { createRequestHandler } from '@routup/body';
import { Router, setRequestBody } from 'routup';
import supertest from 'supertest';
import { mountController } from '../../src';
import { BodyController } from '../data/body';

describe('src/module', () => {
    it('should handle body decorators', async () => {
        const router = new Router();

        router.use(createRequestHandler());

        router.use((req, res, next) => {
            setRequestBody(req, 'foo', 'bar');

            next();
        });

        mountController(router, BodyController);

        const server = supertest(router.createListener());

        let response = await server
            .get('/many');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });

        response = await server
            .get('/single');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });
});
