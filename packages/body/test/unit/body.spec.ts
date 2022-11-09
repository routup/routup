/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from "supertest";
import { setRequestBody, useRequestBody} from "../../src";
import {Router, send} from "routup";

describe('src/module', () => {
    it('should set & get request body', async () => {
        const router = new Router();

        router.get('/',  (req, res) => {
            send(res, useRequestBody(req));
        });

        router.get('/single', (req, res) => {
            send(res, useRequestBody(req, 'foo'));
        })

        router.get('/set-get', (req, res) => {
            setRequestBody(req, { foo: 'bar' });

            setRequestBody(req, { bar: 'baz'});

            setRequestBody(req, { baz: 'foo' }, true);

            send(res, useRequestBody(req));
        })

        router.get('/set-get/single', (req, res) => {
            setRequestBody(req, 'foo', 'bar');

            setRequestBody(req, 'foo', 'baz');

            send(res, useRequestBody(req, 'foo'));
        })

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({});

        response = await server
            .get('/single');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toBeFalsy();

        response = await server
            .get('/set-get');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({bar: 'baz', baz: 'foo'});

        response = await server
            .get('/set-get/single');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('baz');
    })
})
