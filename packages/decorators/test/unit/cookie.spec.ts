/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { createRequestHandler } from '@routup/cookie';
import { Router } from 'routup';
import supertest from 'supertest';
import { mountController } from '../../src';
import { CookieController } from '../data/cookie';

describe('src/decorator', () => {
    it('should handle cookie decorator(s)', async () => {
        const router = new Router();

        router.use(createRequestHandler());

        mountController(router, CookieController);

        const server = supertest(router.createListener());

        let response = await server
            .get('/many')
            .set('Cookie', ['foo=bar']);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });

        response = await server
            .get('/single')
            .set('Cookie', ['foo=bar']);

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });
});
