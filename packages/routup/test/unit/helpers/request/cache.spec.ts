/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from "supertest";
import {Router, send} from "../../../../src";
import {isRequestCacheable} from "../../../../src";

describe('src/helpers/request/cache', () => {
    it('should determine if request is cacheable', async () => {
        const router = new Router();

        router.get('/', async (req, res) => {
            send(res, isRequestCacheable(req, new Date()));
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('false');

        response = await server
            .get('/')
            .set('If-Modified-Since', new Date(Date.now() + 3600).toUTCString());

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('true');
    })
})
