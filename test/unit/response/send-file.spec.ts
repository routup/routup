import { createReadStream } from 'fs';
import fs from 'node:fs';
import supertest from 'supertest';
import type { SendFileOptions } from '../../../src';
import { HeaderName, Router, sendFile } from '../../../src';
import { createHandler } from '../../handler';

const buildSendFileOptions = (
    filePath: string,
    attachment?: boolean,
) : SendFileOptions => ({
    name: filePath,
    getStats() {
        return fs.promises.stat(filePath);
    },
    getContent(options) {
        return createReadStream(filePath, options);
    },
    attachment,
});
describe('src/helpers/response/send-file', () => {
    it('should send file', async () => {
        const server = supertest(createHandler((_req, res) => {
            sendFile(res, buildSendFileOptions('test/data/dummy.json'));
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json; charset=utf-8');
        expect(response.body).toEqual({ id: 1, name: 'tada5hi' });
    });

    it('should not send file', async () => {
        const router = new Router();

        router.get('/', (_req, res) => {
            sendFile(res, buildSendFileOptions('test/data/foo.json'));
        });

        const server = supertest(router.createListener());

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(404);
    });

    it('should not send file promise', async () => {
        const router = new Router();

        router.get('/', (_req, res) => sendFile(res, buildSendFileOptions('test/data/foo.json')));

        const server = supertest(router.createListener());

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(400);
    });

    it('should send file to download', async () => {
        const server = supertest(createHandler((_req, res) => {
            sendFile(res, buildSendFileOptions('test/data/dummy.json', true));
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('application/json; charset=utf-8');
        expect(response.headers[HeaderName.CONTENT_DISPOSITION]).toEqual('attachment; filename="dummy.json"');
        expect(response.body).toEqual({ id: 1, name: 'tada5hi' });
    });

    it('should shrink end of range if it results in an overflow', async () => {
        const server = supertest(createHandler((_req, res) => {
            sendFile(res, buildSendFileOptions('test/data/dummy.txt'));
        }));

        const response = await server
            .get('/')
            .set('Range', 'bytes=10-9999999');

        expect(response).toBeDefined();
        expect(response.status).toEqual(200);

        const file = await fs.promises.readFile('test/data/dummy.txt', { encoding: 'utf-8' });

        expect(response.headers[HeaderName.ETag].substring(0, 6)).toEqual('W/"631');
        expect(response.headers[HeaderName.CONTENT_RANGE]).toEqual(`${`bytes 10-${file.length - 1}`}/${file.length}`);
    });

    it('should throw error when start range exceeds file size', async () => {
        const server = supertest(createHandler((_req, res) => {
            sendFile(res, buildSendFileOptions('test/data/dummy.txt'));
        }));

        const response = await server
            .get('/')
            .set('Range', 'bytes=999-999999');

        expect(response).toBeDefined();
        expect(response.status).toEqual(416);
    });
});
