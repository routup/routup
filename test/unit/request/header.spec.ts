import supertest from 'supertest';
import {
    HeaderName,
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
    setRequestHeader,
} from '../../../src';
import { createHandler } from '../../handler';

describe('src/helpers/request/header', () => {
    it('should set & get request header', async () => {
        const server = supertest(createHandler((req, res) => {
            setRequestHeader(req, 'accept-language', 'de');

            send(res, getRequestHeader(req, 'accept-language'));
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('de');
    });

    it('should get all covered accept header values', async () => {
        const server = supertest(createHandler((req, res) => {
            const accepts = getRequestAcceptableContentTypes(req);

            send(res, accepts);
        }));

        const response = await server
            .get('/')
            .set(HeaderName.ACCEPT, 'application/json, text/html');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(['application/json', 'text/html']);
    });

    it('should get covered accept header value', async () => {
        const server = supertest(createHandler((req, res) => {
            const accepts = getRequestAcceptableContentType(req, 'json');

            send(res, accepts);
        }));

        let response = await server
            .get('/')
            .set(HeaderName.ACCEPT, 'application/json, text/html');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('json');

        // no header -> use any content-type
        response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('json');

        // accept header do not match options
        response = await server
            .get('/')
            .set(HeaderName.ACCEPT, 'image/png');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toBeFalsy();
    });

    it('should get covered accept header value for multiple options', async () => {
        const server = supertest(createHandler((req, res) => {
            const accepts = getRequestAcceptableContentType(req, ['text', 'json']);

            send(res, accepts);
        }));

        const response = await server
            .get('/')
            .set(HeaderName.ACCEPT, 'application/json');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('json');
    });

    it('should get all covered accept charset header values', async () => {
        const server = supertest(createHandler((req, res) => {
            const accepts = getRequestAcceptableCharsets(req);

            send(res, accepts);
        }));

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(['*']);

        response = await server
            .get('/')
            .set(HeaderName.ACCEPT_CHARSET, 'utf-8');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(['utf-8']);
    });

    it('should get covered accept charset header value', async () => {
        const server = supertest(createHandler((req, res) => {
            const accepts = getRequestAcceptableCharset(req, 'utf-8');

            send(res, accepts);
        }));

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('utf-8');

        response = await server
            .get('/')
            .set(HeaderName.ACCEPT_CHARSET, 'binary');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toBeFalsy();
    });

    it('should get all covered accept encoding header values', async () => {
        const server = supertest(createHandler((req, res) => {
            const accepts = getRequestAcceptableEncodings(req);

            send(res, accepts);
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(['gzip', 'deflate', 'identity']);
    });

    it('should get all covered accept encoding header value', async () => {
        const server = supertest(createHandler((req, res) => {
            const accepts = getRequestAcceptableEncoding(req, 'gzip');

            send(res, accepts);
        }));

        let response = await server
            .get('/')
            .set(HeaderName.ACCEPT_ENCODING, 'gzip');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('gzip');

        response = await server
            .get('/')
            .set(HeaderName.ACCEPT_ENCODING, 'deflate');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toBeFalsy();
    });

    it('should get all covered accept language header values', async () => {
        const server = supertest(createHandler((req, res) => {
            const accepts = getRequestAcceptableLanguages(req);

            send(res, accepts);
        }));

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(['*']);

        response = await server
            .get('/')
            .set(HeaderName.ACCEPT_LANGUAGE, 'en');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(['en']);
    });

    it('should get covered accept language header value', async () => {
        const server = supertest(createHandler((req, res) => {
            const accepts = getRequestAcceptableLanguage(req, 'de');

            send(res, accepts);
        }));

        let response = await server
            .get('/de')
            .set(HeaderName.ACCEPT_LANGUAGE, 'de');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('de');

        response = await server
            .get('/de')
            .set(HeaderName.ACCEPT_LANGUAGE, 'en');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toBeFalsy();
    });

    it('should get covered accept language header value for multiple options', async () => {
        const server = supertest(createHandler((req, res) => {
            const accepts = getRequestAcceptableLanguage(req, ['de', 'en']);

            send(res, accepts);
        }));

        const response = await server
            .get('/multiple')
            .set(HeaderName.ACCEPT_LANGUAGE, 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('en');
    });

    it('should match request content type', async () => {
        const server = supertest(createHandler((req, res) => {
            if (matchRequestContentType(req, 'json')) {
                send(res, 'true');
            } else {
                send(res, 'false');
            }
        }));

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
