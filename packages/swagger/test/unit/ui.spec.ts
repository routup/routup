/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import path from 'path';
import supertest from 'supertest';
import { HeaderName, Router } from 'routup';
import { createUIHandler } from '../../src';

describe('src/ui', () => {
    it('should serve ui files', async () => {
        const router = new Router();

        const doc = await import(path.resolve(__dirname, '..', 'data', 'swagger.json'));
        router.use('/docs', createUIHandler(doc));

        const server = supertest(router.createListener());

        let response = await server
            .get('/docs');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');

        response = await server
            .get('/docs/swagger-ui-bundle.js');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/javascript; charset=utf-8');

        response = await server
            .get('/docs/package.json');

        expect(response.statusCode).toEqual(404);
    });
});
