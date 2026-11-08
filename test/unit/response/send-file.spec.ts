import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    App,
    HeaderName,
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
        const router = new App();

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

    it('should treat the deprecated attachment: true option as disposition: attachment', async () => {
        const event = createTestEvent('/');
        const response = await sendFile(event, {
            ...buildSendFileOptions('test/data/dummy.json'),
            attachment: true,
        });

        expect(response.status).toEqual(200);
        expect(response.headers.get(HeaderName.CONTENT_DISPOSITION))
            .toEqual('attachment; filename=dummy.json');
    });

    it('should let disposition take precedence over the deprecated attachment option', async () => {
        const event = createTestEvent('/');
        const response = await sendFile(event, {
            ...buildSendFileOptions('test/data/dummy.json'),
            attachment: true,
            disposition: 'inline',
        });

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

    it('should serve the last bytes for a suffix range', async () => {
        const event = createTestEvent('/', { headers: { 'range': 'bytes=-5' } });
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.txt'));

        const file = await fs.promises.readFile('test/data/dummy.txt', { encoding: 'utf-8' });

        expect(response.status).toEqual(206);
        expect(response.headers.get(HeaderName.CONTENT_RANGE))
            .toEqual(`bytes ${file.length - 5}-${file.length - 1}/${file.length}`);
        expect(response.headers.get(HeaderName.CONTENT_LENGTH)).toEqual('5');
        expect(await response.text()).toEqual(file.slice(-5));
    });

    it('should serve the whole file for a suffix range larger than the file', async () => {
        const event = createTestEvent('/', { headers: { 'range': 'bytes=-9999999' } });
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.txt'));

        const file = await fs.promises.readFile('test/data/dummy.txt', { encoding: 'utf-8' });

        expect(response.status).toEqual(206);
        expect(response.headers.get(HeaderName.CONTENT_RANGE))
            .toEqual(`bytes 0-${file.length - 1}/${file.length}`);
        expect(await response.text()).toEqual(file);
    });

    it('should return 416 for an empty suffix range', async () => {
        const event = createTestEvent('/', { headers: { 'range': 'bytes=-0' } });
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.txt'));

        expect(response.status).toEqual(416);
    });

    it.each([
        ['multiple ranges', 'bytes=0-1,4-5'],
        ['another range unit', 'items=0-5'],
        ['a malformed range', 'bytes=abc'],
        ['a range without positions', 'bytes=-'],
    ])('should ignore %s and serve the whole file', async (_name, range) => {
        const event = createTestEvent('/', { headers: { range } });
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.txt'));

        const file = await fs.promises.readFile('test/data/dummy.txt', { encoding: 'utf-8' });

        expect(response.status).toEqual(200);
        expect(response.headers.get(HeaderName.CONTENT_RANGE)).toBeNull();
        expect(response.headers.get(HeaderName.CONTENT_LENGTH)).toEqual(`${file.length}`);
        expect(await response.text()).toEqual(file);
    });

    it('should return 416 when start range exceeds file size', async () => {
        const event = createTestEvent('/', { headers: { 'range': 'bytes=999-999999' } });
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.txt'));

        expect(response).toBeDefined();
        expect(response.status).toEqual(416);
    });
});
