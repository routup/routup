/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from "supertest";
import {
    appendResponseHeaderDirective,
    HeaderName,
    send,
    setResponseHeaderAttachment,
    setResponseHeaderContentType
} from "../../../../src";
import {Router} from "../../../../src/router/module";

describe('src/helpers/response/header', function () {
    it('should set header attachment', async () => {
        const router = new Router();

        router.get('/',  (req, res) => {
            setResponseHeaderAttachment(res);

            send(res);
        });

        router.get('/file', (req, res) => {
            setResponseHeaderAttachment(res, 'dummy.json');

            send(res)
        })

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_DISPOSITION]).toEqual('attachment');

        response = await server
            .get('/file');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json');
        expect(response.headers[HeaderName.CONTENT_DISPOSITION]).toEqual('attachment; filename="dummy.json"');
    });

    it('should append header value', async () => {
        const router = new Router();

        router.get('/',  (req, res) => {
            appendResponseHeaderDirective(res, HeaderName.CONTENT_TYPE, 'boundary=something')

            send(res);
        });

        router.get('/multiple',  (req, res) => {
            appendResponseHeaderDirective(res, HeaderName.CONTENT_TYPE, [
                'application/json',
                'boundary=something'
            ])

            send(res);
        });

        router.get('/append',  (req, res) => {
            setResponseHeaderAttachment(res, 'dummy.json');
            appendResponseHeaderDirective(res, HeaderName.CONTENT_TYPE, 'boundary=something')

            send(res);
        });

        router.get('/append-multiple',  (req, res) => {
            setResponseHeaderAttachment(res, 'dummy.json');
            appendResponseHeaderDirective(res, HeaderName.CONTENT_TYPE, [
                'charset=utf-8',
                'boundary=something'
            ])

            send(res);
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('boundary=something');

        response = await server
            .get('/multiple');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json; boundary=something');

        response = await server
            .get('/append');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json; boundary=something');

        response = await server
            .get('/append-multiple');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json; charset=utf-8; boundary=something');
    })

    it('should set response content type', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            setResponseHeaderContentType(res, 'application/json');
            setResponseHeaderContentType(res, 'text/html', true);

            send(res);
        });

        router.get('/overwrite', (req, res) => {
            setResponseHeaderContentType(res, 'application/json');
            setResponseHeaderContentType(res, 'text/html');

            send(res);
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json');

        response = await server
            .get('/overwrite');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html');
    });
});
