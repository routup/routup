/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from 'supertest';
import {
    Router,
    getRequestAcceptableCharset,
    getRequestAcceptableCharsets,
    getRequestAcceptableContentType,
    getRequestAcceptableContentTypes,
    getRequestAcceptableEncoding,
    getRequestAcceptableEncodings,
    getRequestAcceptableLanguage,
    getRequestAcceptableLanguages,
    getRequestHeader,
    matchRequestContentType,
    send,
    setRequestHeader, HeaderName,
} from '../../../../src';

describe('src/helpers/request/header', () => {
    it('should set and get request header', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            setRequestHeader(req, 'accept-language', 'de');

            send(res, getRequestHeader(req, 'accept-language'));
        });

        const server = supertest(router.createListener());

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('de');
    });

    it('should handle accept header', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            const accepts = getRequestAcceptableContentTypes(req);

            send(res, accepts);
        });

        router.get('/json', (req, res) => {
            const accepts = getRequestAcceptableContentType(req, 'json');

            send(res, accepts);
        });

        router.get('/multiple', (req, res) => {
            const accepts = getRequestAcceptableContentType(req, ['text', 'json']);

            send(res, accepts);
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/')
            .set(HeaderName.ACCEPT, 'application/json, text/html');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(['application/json', 'text/html']);

        response = await server
            .get('/json')
            .set(HeaderName.ACCEPT, 'application/json, text/html');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('json');

        // no header -> use any content-type
        response = await server
            .get('/json');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('json');

        // accept header do not match options
        response = await server
            .get('/json')
            .set(HeaderName.ACCEPT, 'image/png');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toBeFalsy();

        // accept header match one of available options
        response = await server
            .get('/multiple')
            .set(HeaderName.ACCEPT, 'application/json');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('json');
    });

    it('should handle accept charset header', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            const accepts = getRequestAcceptableCharsets(req);

            send(res, accepts);
        });

        router.get('/utf-8', (req, res) => {
            const accepts = getRequestAcceptableCharset(req, 'utf-8');

            send(res, accepts);
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(['*']);

        response = await server
            .get('/')
            .set(HeaderName.ACCEPT_CHARSET, 'utf-8');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(['utf-8']);

        response = await server
            .get('/utf-8');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('utf-8');

        response = await server
            .get('/utf-8')
            .set(HeaderName.ACCEPT_CHARSET, 'binary');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toBeFalsy();
    });

    it('should handle accept encoding header', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            const accepts = getRequestAcceptableEncodings(req);

            send(res, accepts);
        });

        router.get('/gzip', (req, res) => {
            const accepts = getRequestAcceptableEncoding(req, 'gzip');

            send(res, accepts);
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(['gzip', 'deflate', 'identity']);

        response = await server
            .get('/gzip')
            .set(HeaderName.ACCEPT_ENCODING, 'gzip');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('gzip');

        response = await server
            .get('/gzip')
            .set(HeaderName.ACCEPT_ENCODING, 'deflate');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toBeFalsy();
    });

    it('should handle accept language header', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            const accepts = getRequestAcceptableLanguages(req);

            send(res, accepts);
        });

        router.get('/de', (req, res) => {
            const accepts = getRequestAcceptableLanguage(req, 'de');

            send(res, accepts);
        });

        router.get('/multiple', (req, res) => {
            const accepts = getRequestAcceptableLanguage(req, ['de', 'en']);

            send(res, accepts);
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(['*']);

        response = await server
            .get('/')
            .set(HeaderName.ACCEPT_LANGUAGE, 'en');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(['en']);

        response = await server
            .get('/de')
            .set(HeaderName.ACCEPT_LANGUAGE, 'de');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('de');

        response = await server
            .get('/de')
            .set(HeaderName.ACCEPT_LANGUAGE, 'en');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toBeFalsy();

        response = await server
            .get('/multiple')
            .set(HeaderName.ACCEPT_LANGUAGE, 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('en');
    });

    it('should match request content type', async () => {
        const router = new Router();

        router.get('/', (req, res) => {
            if (matchRequestContentType(req, 'json')) {
                send(res, 'true');
            } else {
                send(res, 'false');
            }
        });

        const server = supertest(router.createListener());

        let response = await server
            .get('/')
            .set(HeaderName.CONTENT_TYPE, 'application/json; charset=utf-8');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('true');

        response = await server
            .get('/')
            .set(HeaderName.CONTENT_TYPE, 'text/html; charset=utf-8');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('false');

        response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('true');
    });
});
