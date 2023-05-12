/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from 'supertest';
import { HeaderName, Router } from 'routup';
import type { UIOptions } from '../../../src';
import { createUIHandler } from '../../../src';

const createRouter = async (options?: UIOptions) => {
    const router = new Router();

    router.use('/docs', createUIHandler('test/data/swagger.json', options));

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

    it('should serve swagger ui files on custom base path', async () => {
        const router = await createRouter({
            basePath: '/api/',
        });
        const server = supertest(router.createListener());

        const response = await server
            .get('/docs');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
        expect(response.text.includes('<base href="/api/docs/" />')).toBeTruthy();
    });

    it('should serve swagger ui files on custom base url', async () => {
        const router = await createRouter({
            baseURL: 'https://example.com/api/',
        });
        const server = supertest(router.createListener());

        const response = await server
            .get('/docs');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
        expect(response.text.includes('<base href="https://example.com/api/docs/" />')).toBeTruthy();
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
