/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from "supertest";
import {Router, send, setRequestEnv, unsetRequestEnv, useRequestEnv} from "../../../../src";

describe('src/helpers/request/env', () => {
    it('set request env', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            setRequestEnv(req, 'foo', 'bar');

            send(res, useRequestEnv(req, 'foo'));
        })

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    })

    it('set request env object', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            setRequestEnv(req, {
                foo: 'bar',
                bar: 'baz'
            });

            send(res, useRequestEnv(req));
        })

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            foo: 'bar',
            bar: 'baz'
        });
    })

    it('should append env to request', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            setRequestEnv(req, {
                foo: 'bar'
            });

            setRequestEnv(req, {
                bar: 'baz',
            }, true);

            send(res, useRequestEnv(req));
        })

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            foo: 'bar',
            bar: 'baz'
        });
    })

    it('should overwrite env of request', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            setRequestEnv(req, {
                foo: 'bar'
            });

            setRequestEnv(req, {
                bar: 'baz',
            });

            send(res, useRequestEnv(req));
        })

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            bar: 'baz'
        });
    })

    it('should unset env of request', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            setRequestEnv(req, {
                foo: 'bar',
                bar: 'baz'
            });

            unsetRequestEnv(req, 'foo');

            send(res, useRequestEnv(req));
        })

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            bar: 'baz'
        });
    });
});
