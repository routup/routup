/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { createHandler } from '@routup/cookie';
import { Router } from 'routup';
import supertest from 'supertest';
import { mountController } from '../../src';
import { CookieController } from '../data/cookie';

describe('data/cookie', () => {
    it('should handle decorator endpoints', async () => {
        const router = new Router();

        router.use(createHandler());

        mountController(router, CookieController);

        const server = supertest(router.createListener());

        let response = await server
            .get('/cookie/many')
            .set('Cookie', ['foo=bar']);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ foo: 'bar' });

        response = await server
            .get('/cookie/single')
            .set('Cookie', ['foo=bar']);

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });
});
