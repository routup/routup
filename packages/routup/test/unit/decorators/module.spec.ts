/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from 'supertest';
import { Router } from '../../../src';
import { DummyController } from '../../data/decorators/extra';
import { UserController } from '../../data/decorators/core';

describe('src/module', () => {
    it('should handle core decorators', async () => {
        const router = new Router();

        router.useControllers([UserController]);

        const server = supertest(router.createListener());

        let response = await server
            .get('/users');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('many');

        response = await server
            .get('/users/admin');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('admin');

        response = await server
            .post('/users');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('create');

        response = await server
            .delete('/users/admin');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ id: 'admin' });

        response = await server
            .delete('/users/a');

        expect(response.statusCode).toEqual(400);

        response = await server
            .put('/users');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('put');

        response = await server
            .patch('/users');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('patch');
    });

    it('should handle extra decorators', async () => {
        const router = new Router();

        const controller = new DummyController();

        router.useController(controller);

        const server = supertest(router.createListener());

        let response = await server
            .get('/headers');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toBeDefined();

        response = await server
            .get('/header');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('close');

        response = await server
            .get('/middleware');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('value');
    });
});
