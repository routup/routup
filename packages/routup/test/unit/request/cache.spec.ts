/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from 'supertest';
import { isRequestCacheable, send } from '../../../src';
import { createHandler } from '../../handler';

describe('src/helpers/request/cache', () => {
    it('should be cacheable', async () => {
        const server = supertest(createHandler((req, res) => {
            send(res, isRequestCacheable(req, new Date()));
        }));

        const response = await server
            .get('/')
            .set('If-Modified-Since', new Date(Date.now() + 3600).toUTCString());

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('true');
    });

    it('should not be cacheable', async () => {
        const server = supertest(createHandler((req, res) => {
            send(res, isRequestCacheable(req, new Date()));
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('false');
    });
});
