/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import path from 'path';
import supertest from 'supertest';
import { HeaderName, sendFile } from '../../../../src';
import { sendAccepted } from '../../../../src';
import { sendCreated } from '../../../../src';
import { sendRedirect } from '../../../../src';
import { Router } from '../../../../src';

describe('src/helpers/response/send', () => {
    it('should send file', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            const filePath = path.join(__dirname, '..', '..', '..', 'data', 'dummy.json');

            sendFile(res, filePath);
        });

        router.get('/foo', (req, res) => {
            const filePath = path.join(__dirname, '..', '..', '..', 'data', 'foo.json');

            sendFile(res, filePath);
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json');
        expect(response.headers[HeaderName.CONTENT_DISPOSITION]).toEqual('attachment; filename="dummy.json"');
        expect(response.body).toEqual({ id: 1, name: 'tada5hi' });

        response = await server
            .get('/foo');

        expect(response.statusCode).toEqual(500);
    });

    it('should send redirect', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            sendRedirect(res, 'https://google.de');
        });

        const server = supertest(router.createListener());

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(302);
        expect(response.headers[HeaderName.LOCATION]).toEqual('https://google.de');
        expect(response.text).toEqual('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=https://google.de"></head></html>');
    });

    it('should send accepted & created response', async () => {
        const router = new Router();

        router.get('/accepted', (req, res) => {
            sendAccepted(res);
        });

        router.get('/created', (req, res) => {
            sendCreated(res);
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/accepted');

        expect(response.statusCode).toEqual(202);

        response = await server
            .get('/created');

        expect(response.statusCode).toEqual(201);
    });
});
