import path from 'node:path';
import supertest from 'supertest';
import {
    HeaderName, send, sendAccepted, sendCreated, sendFile, sendRedirect,
} from '../../../src';
import { createHandler } from '../../handler';

describe('src/helpers/response/send', () => {
    it('should send text as html', async () => {
        const server = supertest(createHandler((req, res) => {
            send(res, 'foo');
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
    });

    it('should send file', async () => {
        const server = supertest(createHandler((req, res) => {
            const filePath = path.join(__dirname, '..', '..', 'data', 'dummy.json');

            sendFile(res, filePath);
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json; charset=utf-8');
        expect(response.body).toEqual({ id: 1, name: 'tada5hi' });
    });

    it('should send file to download', async () => {
        const server = supertest(createHandler((req, res) => {
            const filePath = path.join(__dirname, '..', '..', 'data', 'dummy.json');

            sendFile(res, {
                filePath,
                attachment: true,
            });
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json; charset=utf-8');
        expect(response.headers[HeaderName.CONTENT_DISPOSITION]).toEqual('attachment; filename="dummy.json"');
        expect(response.body).toEqual({ id: 1, name: 'tada5hi' });
    });

    it('should not send file', async () => {
        const server = supertest(createHandler((req, res) => {
            const filePath = path.join(__dirname, '..', '..', 'data', 'foo.json');

            sendFile(res, filePath);
        }));

        const response = await server
            .get('/foo');

        expect(response.statusCode).toEqual(404);
    });

    it('should send redirect', async () => {
        const server = supertest(createHandler((req, res) => {
            sendRedirect(res, 'https://google.de');
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(302);
        expect(response.headers[HeaderName.LOCATION]).toEqual('https://google.de');
        expect(response.text).toEqual('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=https://google.de"></head></html>');
    });

    it('should send accepted response', async () => {
        const server = supertest(createHandler((req, res) => {
            sendAccepted(res);
        }));

        const response = await server
            .get('/acceted');

        expect(response.statusCode).toEqual(202);
    });

    it('should send created response', async () => {
        const server = supertest(createHandler((req, res) => {
            sendCreated(res);
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(201);
    });
});
