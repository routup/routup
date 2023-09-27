import supertest from 'supertest';
import {
    HeaderName, send, sendAccepted, sendCreated, sendRedirect,
} from '../../../src';
import { createRequestListener } from '../../handler';

describe('src/helpers/response/send', () => {
    it('should send text as html', async () => {
        const server = supertest(createRequestListener((req, res) => {
            send(res, 'foo');
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
    });

    it('should send redirect', async () => {
        const server = supertest(createRequestListener((req, res) => {
            sendRedirect(res, 'https://google.de');
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(302);
        expect(response.headers[HeaderName.LOCATION]).toEqual('https://google.de');
        expect(response.text).toEqual('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=https://google.de"></head></html>');
    });

    it('should send accepted response', async () => {
        const server = supertest(createRequestListener((req, res) => {
            sendAccepted(res);
        }));

        const response = await server
            .get('/acceted');

        expect(response.statusCode).toEqual(202);
    });

    it('should send created response', async () => {
        const server = supertest(createRequestListener((req, res) => {
            sendCreated(res);
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(201);
    });
});
