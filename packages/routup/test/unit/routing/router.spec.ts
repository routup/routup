/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {GatewayTimeoutErrorOptions, NotFoundErrorOptions} from '@ebec/http';
import supertest from 'supertest';
import {Router, send, useRequestParams} from '../../../src';

describe('src/module', () => {
    it('should process async & sync handler', async () => {
        const router = new Router();

        router.get('/async', async (req, res) => {
            return await new Promise((resolve) => {
                setTimeout(() => resolve('foo'), 0);
            });
        });

        router.get('/sync',  () => {
            return 'bar';
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/async');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('foo');

        response = await server
            .get('/sync');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });

    it('should process dynamic path', async () => {
        const router = new Router();

        router.get('/param/:id', async (req, res) => {
            const params = useRequestParams(req);

            send(res, params.id);
        });

        const server = supertest(router.createListener());

        const response = await server
            .get('/param/abc');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('abc');
    });

    it('should process with no matching route', async () => {
        const router = new Router();

        router.get('/param/:id', async (req, res) => {
            send(res, 'foo');
        });

        const server = supertest(router.createListener());

        const response = await server
            .get('/foo');

        expect(response.statusCode).toEqual(NotFoundErrorOptions.statusCode);
    });

    it('should process with missing response', async () => {
        const router = new Router({
            timeout: 100,
        });

        router.get('/', async () => {});

        const server = supertest(router.createListener());

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(GatewayTimeoutErrorOptions.statusCode);
    });

    it('should process with error thrown', async () => {
        const router = new Router();

        router.get('/', () => {
            throw new Error('foo');
        });

        router.get('/async', async () => {
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('bar'));
                }, 0);
            });
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(400);

        response = await server
            .get('/async');

        expect(response.statusCode).toEqual(400);
    });
});
