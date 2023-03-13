/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Router } from 'routup';
import supertest from 'supertest';
import { mountController } from '../../src';
import { HeaderController } from '../data/header';

describe('header.ts', () => {
    it('should handle extra decorators', async () => {
        const router = new Router();

        const controller = new HeaderController();

        mountController(router, controller);

        const server = supertest(router.createListener());

        let response = await server
            .get('/header/many');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toBeDefined();

        response = await server
            .get('/header/single');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('close');
    });
});
