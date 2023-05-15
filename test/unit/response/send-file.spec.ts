import fs from 'node:fs';
import supertest from 'supertest';
import { HeaderName, sendFile } from '../../../src';
import { createHandler } from '../../handler';

describe('src/helpers/response/send-file', () => {
    it('should send file', async () => {
        const server = supertest(createHandler((req, res) => {
            sendFile(res, 'test/data/dummy.json');
        }));

        const response = await server
            .get('/');

        expect(response).toBeDefined();
        expect(response.status).toEqual(200);
    });

    it('should shrink end of range if it results in an overflow', async () => {
        const server = supertest(createHandler((req, res) => {
            sendFile(res, 'test/data/dummy.txt');
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
        const server = supertest(createHandler((req, res) => {
            sendFile(res, 'test/data/dummy.txt');
        }));

        const response = await server
            .get('/')
            .set('Range', 'bytes=999-999999');

        expect(response).toBeDefined();
        expect(response.status).toEqual(416);
    });
});
