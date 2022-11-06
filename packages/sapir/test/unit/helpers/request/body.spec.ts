/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from "supertest";
import { send, setRequestBody, useRequestBody} from "../../../../src";
import {Router} from "../../../../src/router/module";

describe('src/helpers/request/body', () => {
    it('should set & get request body', async () => {
        const router = new Router();

        router.get('/',  (req, res) => {
            send(res, useRequestBody(req));
        });

        router.get('/set-get', (req, res) => {
            setRequestBody(req, 'foo');

            send(res, useRequestBody(req));
        })

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toBeFalsy();

        response = await server
            .get('/set-get');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('foo');
    })
})
