/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from "supertest";
import {send, setResponseBody, setResponseHeaderContentType, useResponseBody} from "../../../../src";
import {Router} from "../../../../src/module";

describe('src/helpers/response/body', () => {
    it('should set & get response body', async () => {
        const router = new Router();

        router.get('/',  (req, res) => {
            send(res, useResponseBody(res));
        });

        router.get('/set-get', (req, res) => {
            setResponseHeaderContentType(res, 'text/html');
            setResponseBody(res, Buffer.from('foo', 'utf-8'));

            send(res, useResponseBody(res));
        })

        const server = supertest(router.listener());

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
