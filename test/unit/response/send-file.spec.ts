import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    HeaderName,
    Router,
    defineCoreHandler,
    sendFile,
} from '../../../src';
import type { SendFileDisposition, SendFileOptions } from '../../../src';
import { createTestEvent, createTestRequest } from '../../helpers';

const buildSendFileOptions = (
    filePath: string,
    disposition?: SendFileDisposition,
): SendFileOptions => ({
    name: filePath,
    async stats() {
        const stat = await fs.promises.stat(filePath);
        return {
            size: stat.size,
            mtime: stat.mtime,
            name: path.basename(filePath),
        };
    },
    async content(options) {
        const buffer = await fs.promises.readFile(filePath);
        if (options.start !== undefined || options.end !== undefined) {
            return buffer.slice(options.start || 0, options.end !== undefined ? options.end + 1 : undefined);
        }
        return buffer;
    },
    disposition,
});

describe('src/helpers/response/send-file', () => {
    it('should send file', async () => {
        const event = createTestEvent('/');
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.json'));

        expect(response.status).toEqual(200);
        expect(response.headers.get(HeaderName.CONTENT_TYPE))
            .toEqual('application/json; charset=utf-8');

        const body = await response.json();
        expect(body).toEqual({
            id: 1,
            name: 'tada5hi',
        });
    });

    it('should return 500 for non-existent file', async () => {
        const router = new Router();

        router.get('/', defineCoreHandler((event) =>
            sendFile(event, buildSendFileOptions('test/data/foo.json'))));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(500);
    });

    it('should send file to download', async () => {
        const event = createTestEvent('/');
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.json', 'attachment'));

        expect(response.status).toEqual(200);
        expect(response.headers.get(HeaderName.CONTENT_TYPE))
            .toEqual('application/json; charset=utf-8');
        expect(response.headers.get(HeaderName.CONTENT_DISPOSITION))
            .toEqual('attachment; filename=dummy.json');

        const body = await response.json();
        expect(body).toEqual({
            id: 1,
            name: 'tada5hi',
        });
    });

    it('should send file inline with suggested filename', async () => {
        const event = createTestEvent('/');
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.json', 'inline'));

        expect(response.status).toEqual(200);
        expect(response.headers.get(HeaderName.CONTENT_DISPOSITION))
            .toEqual('inline; filename=dummy.json');
    });

    it('should shrink end of range if it results in an overflow', async () => {
        const event = createTestEvent('/', { headers: { 'range': 'bytes=10-9999999' } });
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.txt'));

        expect(response).toBeDefined();

        const file = await fs.promises.readFile('test/data/dummy.txt', { encoding: 'utf-8' });

        expect(response.headers.get(HeaderName.ETag)!.substring(0, 6)).toEqual('W/"631');
        expect(response.headers.get(HeaderName.CONTENT_RANGE))
            .toEqual(`bytes 10-${file.length - 1}/${file.length}`);
    });

    it('should return 416 when start range exceeds file size', async () => {
        const event = createTestEvent('/', { headers: { 'range': 'bytes=999-999999' } });
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.txt'));

        expect(response).toBeDefined();
        expect(response.status).toEqual(416);
    });
});
