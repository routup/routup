/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import path from 'node:path';
import supertest from 'supertest';
import { HeaderName, Router } from 'routup';
import { createUIHandler } from '../../src';

const createRouter = async () => {
    const router = new Router();

    const doc = await import(path.resolve(__dirname, '..', 'data', 'swagger.json'));
    router.use('/docs', createUIHandler(doc));

    return router;
};

describe('src/ui', () => {
    it('should serve template file', async () => {
        const router = await createRouter();
        const server = supertest(router.createListener());

        let response = await server
            .get('/docs');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
        expect(response.text.includes('<base href="/docs/" />')).toBeTruthy();

        response = await server
            .get('/docs/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
        expect(response.text.includes('<base href="/docs/" />')).toBeTruthy();

        response = await server
            .get('/docs/foo');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
        expect(response.text.includes('<base href="/docs/" />')).toBeTruthy();
    });

    it('should serve template file for nested routers', async () => {
        const router = new Router();
        const child = await createRouter();
        router.use('/sub', child);

        const server = supertest(router.createListener());

        let response = await server
            .get('/sub/docs');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
        expect(response.text.includes('<base href="/sub/docs/" />')).toBeTruthy();

        response = await server
            .get('/sub/docs/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
        expect(response.text.includes('<base href="/sub/docs/" />')).toBeTruthy();
    });

    it('should serve swagger ui files', async () => {
        const router = await createRouter();
        const server = supertest(router.createListener());

        const response = await server
            .get('/docs/swagger-ui-bundle.js');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/javascript; charset=utf-8');
    });

    it('should not serve package.json', async () => {
        const router = await createRouter();
        const server = supertest(router.createListener());

        const response = await server
            .get('/docs/package.json');

        expect(response.statusCode).toEqual(404);
    });
});
