/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from "supertest";
import {Route, Router, send} from "../../../src";

describe('routing/methods', () => {
    it('should handle different methods', async () => {
        const router = new Router();

        router.delete('/delete', async (req, res) => {
            send(res, 'delete');
        });

        router.get('/get', async (req, res) => {
            send(res, 'get');
        });

        router.patch('/patch', async (req, res) => {
            send(res, 'patch');
        })

        router.post('/post', async (req, res) => {
            send(res, 'post');
        })

        router.put('/put', async (req, res) => {
            send(res, 'put');
        })

        const server = supertest(router.createListener());

        let response = await server
            .delete('/delete');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('delete');

        response = await server
            .get('/get');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('get');

        response = await server
            .patch('/patch');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('patch');

        response = await server
            .post('/post');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('post');

        response = await server
            .put('/put');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('put');
    });

    it('should handle different methods on same path', async () => {
        const router = new Router();

        router.delete('/', async (req, res) => {
            send(res, 'delete');
        });

        router.get('/', async (req, res) => {
            send(res, 'get');
        });

        router.patch('/', async (req, res) => {
            send(res, 'patch');
        })

        router.post('/', async (req, res) => {
            send(res, 'post');
        })

        router.put('/', async (req, res) => {
            send(res, 'put');
        })

        const server = supertest(router.createListener());

        let response = await server
            .delete('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('delete');

        response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('get');

        response = await server
            .patch('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('patch');

        response = await server
            .post('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('post');

        response = await server
            .put('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('put');
    });

    it('should handle different methods via route', async () => {
        const router = new Router();

        const route = router.route('/foo');

        route.delete( async (req, res) => {
            send(res, 'delete');
        });

        route.get(async (req, res) => {
            send(res, 'get');
        });

        route.patch(async (req, res) => {
            send(res, 'patch');
        })

        route.post(async (req, res) => {
            send(res, 'post');
        })

        route.put(async (req, res) => {
            send(res, 'put');
        })

        const server = supertest(router.createListener());

        let response = await server
            .delete('/foo');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('delete');

        response = await server
            .get('/foo');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('get');

        response = await server
            .patch('/foo');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('patch');

        response = await server
            .post('/foo');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('post');

        response = await server
            .put('/foo');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('put');
    });
});
