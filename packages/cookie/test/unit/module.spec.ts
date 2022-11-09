/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from "supertest";
import { send, Router } from "routup";
import {setResponseCookie, useRequestCookie, useRequestCookies} from "../../src";

describe('src/module', () => {
    it('should parse cookie', async () => {
        const router = new Router();

        router.get('/',  (req, res) => {
            useRequestCookies(req);

            const foo = useRequestCookie(req, 'foo');
            send(res, foo);
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/')
            .set('Cookie', ['foo=bar'])

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });

    it('should set cookie', async () => {
        const router = new Router();

        router.get('/',  (req, res) => {
            setResponseCookie(res, 'bar', 'baz');

            send(res);
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/')
            .set('Cookie', ['foo=bar'])

        expect(response.statusCode).toEqual(200);
        expect(response.headers['cookie']).toEqual('bar=baz; Path=/');
    })
})
