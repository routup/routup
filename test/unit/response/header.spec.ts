/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from 'supertest';
import {
    HeaderName,
    appendResponseHeader,
    appendResponseHeaderDirective,
    send,
    setResponseHeaderAttachment,
    setResponseHeaderContentType,
} from '../../../src';
import { createHandler } from '../../handler';

describe('src/helpers/response/header', () => {
    it('should set header attachment', async () => {
        const server = supertest(createHandler((req, res) => {
            setResponseHeaderAttachment(res);

            send(res);
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_DISPOSITION]).toEqual('attachment');
    });

    it('should set header attachment by filename ', async () => {
        const server = supertest(createHandler((req, res) => {
            setResponseHeaderAttachment(res, 'dummy.json');

            send(res);
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json; charset=utf-8');
        expect(response.headers[HeaderName.CONTENT_DISPOSITION]).toEqual('attachment; filename="dummy.json"');
    });

    it('should append value', async () => {
        const server = supertest(createHandler((req, res) => {
            appendResponseHeader(res, HeaderName.SET_COOKIE, 'foo=bar; Path=/');
            appendResponseHeader(res, HeaderName.SET_COOKIE, 'bar=baz; Path=/');

            send(res);
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.SET_COOKIE]).toEqual([
            'foo=bar; Path=/',
            'bar=baz; Path=/',
        ]);
    });

    it('should set header directive value', async () => {
        const server = supertest(createHandler((req, res) => {
            appendResponseHeaderDirective(res, HeaderName.CONTENT_TYPE, 'boundary=something');

            send(res);
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('boundary=something');
    });

    it('should set multiple header directive values', async () => {
        const server = supertest(createHandler((req, res) => {
            appendResponseHeaderDirective(res, HeaderName.CONTENT_TYPE, [
                'application/json',
                'boundary=something',
            ]);

            send(res);
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json; boundary=something');
    });

    it('should append single header directive value', async () => {
        const server = supertest(createHandler((req, res) => {
            setResponseHeaderAttachment(res, 'dummy.json');
            appendResponseHeaderDirective(res, HeaderName.CONTENT_TYPE, 'boundary=something');

            send(res);
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json; charset=utf-8; boundary=something');
    });

    it('should append multiple header directive values', async () => {
        const server = supertest(createHandler((req, res) => {
            setResponseHeaderAttachment(res, 'dummy.json');
            appendResponseHeaderDirective(res, HeaderName.CONTENT_TYPE, [
                'charset=utf-8',
                'boundary=something',
            ]);

            send(res);
        }));

        const response = await server
            .get('/append-multiple');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json; charset=utf-8; boundary=something');
    });

    it('should set response content type', async () => {
        const server = supertest(createHandler((req, res) => {
            setResponseHeaderContentType(res, 'application/json');
            setResponseHeaderContentType(res, 'text/html', true);

            send(res);
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json');
    });

    it('should overwrite response content-type', async () => {
        const server = supertest(createHandler((req, res) => {
            setResponseHeaderContentType(res, 'application/json');
            setResponseHeaderContentType(res, 'text/html');

            send(res);
        }));

        const response = await server
            .get('/overwrite');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html');
    });
});
