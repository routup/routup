/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Router } from 'routup';
import supertest from 'supertest';
import { HeaderName, send, setResponseCacheHeaders } from '../../../src';

describe('src/helpers/response/cache', () => {
    it('should determine if request is cacheable', async () => {
        const router = new Router();

        const date = new Date();

        router.get('/', async (req, res) => {
            setResponseCacheHeaders(res, {
                maxAge: 3600,
                modifiedTime: date,
                cacheControls: [
                    'must-revalidate',
                ],
            });

            send(res);
        });

        const server = supertest(router.createListener());

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CACHE_CONTROL]).toEqual('public, must-revalidate, max-age=3600, s-maxage=3600');
        expect(response.headers[HeaderName.LAST_MODIFIED]).toEqual(date.toUTCString());
    });
});
