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

    it('should ignore a range on a non-GET request', async () => {
        const event = createTestEvent('/', { method: 'POST', headers: { 'range': 'bytes=-5' } });
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.txt'));

        expect(response.status).toEqual(200);
        expect(response.headers.get(HeaderName.CONTENT_RANGE)).toBeNull();
    });

    it('should ignore a range when If-Range does not match the file', async () => {
        const event = createTestEvent('/', {
            headers: {
                'range': 'bytes=0-5',
                'if-range': 'Thu, 01 Jan 1970 00:00:00 GMT',
            },
        });
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.txt'));

        expect(response.status).toEqual(200);
        expect(response.headers.get(HeaderName.CONTENT_RANGE)).toBeNull();
    });

    it('should serve a range when If-Range matches the last modification date', async () => {
        const stat = await fs.promises.stat('test/data/dummy.txt');
        const event = createTestEvent('/', {
            headers: {
                'range': 'bytes=0-5',
                'if-range': stat.mtime.toUTCString(),
            },
        });
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.txt'));

        expect(response.status).toEqual(206);
    });

    it('should return 416 when start range exceeds file size', async () => {
        const event = createTestEvent('/', { headers: { 'range': 'bytes=999-999999' } });
        const response = await sendFile(event, buildSendFileOptions('test/data/dummy.txt'));

        expect(response).toBeDefined();
        expect(response.status).toEqual(416);
    });

    describe('conditional requests', () => {
        const filePath = 'test/data/dummy.txt';

        const getValidators = async () => {
            const stat = await fs.promises.stat(filePath);

            return {
                etag: `W/"${stat.size}-${stat.mtime.getTime()}"`,
                lastModified: stat.mtime.toUTCString(),
                mtime: stat.mtime,
            };
        };

        const buildTrackedOptions = () => {
            const options = buildSendFileOptions(filePath);
            const tracked = { calls: 0 };

            return {
                tracked,
                options: {
                    ...options,
                    content(contentOptions: Parameters<SendFileOptions['content']>[0]) {
                        tracked.calls++;

                        return options.content(contentOptions);
                    },
                } satisfies SendFileOptions,
            };
        };

        it('should answer a matching If-None-Match with 304 without reading the file', async () => {
            const { etag, lastModified } = await getValidators();
            const event = createTestEvent('/', { headers: { 'if-none-match': etag } });
            const { tracked, options } = buildTrackedOptions();

            const response = await sendFile(event, options);

            expect(response.status).toEqual(304);
            expect(await response.text()).toEqual('');
            expect(response.headers.get(HeaderName.ETag)).toEqual(etag);
            expect(response.headers.get(HeaderName.LAST_MODIFIED)).toEqual(lastModified);
            expect(response.headers.get(HeaderName.ACCEPT_RANGES)).toEqual('bytes');
            expect(response.headers.get(HeaderName.CONTENT_LENGTH)).toBeNull();
            expect(response.headers.get(HeaderName.CONTENT_RANGE)).toBeNull();
            expect(tracked.calls).toEqual(0);
        });

        it('should return a 304 whose headers can be changed', async () => {
            const { etag } = await getValidators();
            const event = createTestEvent('/', { headers: { 'if-none-match': etag } });

            const response = await sendFile(event, buildSendFileOptions(filePath));

            response.headers.set('cache-control', 'no-cache');

            expect(response.headers.get('cache-control')).toEqual('no-cache');
        });

        it('should keep cache headers set before sendFile on a 304', async () => {
            const { etag } = await getValidators();
            const event = createTestEvent('/', { headers: { 'if-none-match': etag } });

            event.response.headers.set('cache-control', 'public, max-age=60');

            const response = await sendFile(event, buildSendFileOptions(filePath));

            expect(response.status).toEqual(304);
            expect(response.headers.get('cache-control')).toEqual('public, max-age=60');
        });

        it('should answer If-None-Match: * with 304', async () => {
            const event = createTestEvent('/', { headers: { 'if-none-match': '*' } });
            const response = await sendFile(event, buildSendFileOptions(filePath));

            expect(response.status).toEqual(304);
        });

        it('should compare the etag weakly', async () => {
            const { etag } = await getValidators();
            const strong = etag.slice(2);
            const event = createTestEvent('/', { headers: { 'if-none-match': `"other", ${strong}` } });
            const response = await sendFile(event, buildSendFileOptions(filePath));

            expect(response.status).toEqual(304);
        });

        it('should send the file for a non-matching If-None-Match', async () => {
            const event = createTestEvent('/', { headers: { 'if-none-match': 'W/"0-0"' } });
            const response = await sendFile(event, buildSendFileOptions(filePath));

            const file = await fs.promises.readFile(filePath, { encoding: 'utf-8' });

            expect(response.status).toEqual(200);
            expect(response.headers.get(HeaderName.CONTENT_LENGTH)).toEqual(`${file.length}`);
            expect(await response.text()).toEqual(file);
        });

        it('should answer an If-Modified-Since equal to Last-Modified with 304', async () => {
            const { lastModified } = await getValidators();
            const event = createTestEvent('/', { headers: { 'if-modified-since': lastModified } });
            const { tracked, options } = buildTrackedOptions();

            const response = await sendFile(event, options);

            expect(response.status).toEqual(304);
            expect(response.headers.get(HeaderName.LAST_MODIFIED)).toEqual(lastModified);
            expect(response.headers.get(HeaderName.CONTENT_LENGTH)).toBeNull();
            expect(tracked.calls).toEqual(0);
        });

        it('should compare If-Modified-Since at second resolution', async () => {
            const mtime = new Date('2024-01-01T10:00:00.750Z');
            const event = createTestEvent('/', { headers: { 'if-modified-since': mtime.toUTCString() } });

            const response = await sendFile(event, {
                stats: { size: 3, mtime },
                content: () => new Uint8Array([1, 2, 3]),
            });

            expect(response.status).toEqual(304);
        });

        it('should send the file for an older If-Modified-Since', async () => {
            const { mtime } = await getValidators();
            const older = new Date(mtime.getTime() - 3_600_000).toUTCString();
            const event = createTestEvent('/', { headers: { 'if-modified-since': older } });
            const response = await sendFile(event, buildSendFileOptions(filePath));

            expect(response.status).toEqual(200);
        });

        it('should ignore a fresh If-Modified-Since when If-None-Match does not match', async () => {
            const { lastModified } = await getValidators();
            const event = createTestEvent('/', {
                headers: {
                    'if-none-match': 'W/"0-0"',
                    'if-modified-since': lastModified,
                },
            });
            const response = await sendFile(event, buildSendFileOptions(filePath));

            expect(response.status).toEqual(200);
        });

        it('should prefer a fresh conditional over a range', async () => {
            const { etag } = await getValidators();
            const event = createTestEvent('/', {
                headers: {
                    'if-none-match': etag,
                    'range': 'bytes=0-5',
                },
            });
            const response = await sendFile(event, buildSendFileOptions(filePath));

            expect(response.status).toEqual(304);
            expect(response.headers.get(HeaderName.CONTENT_RANGE)).toBeNull();
            expect(response.headers.get(HeaderName.CONTENT_LENGTH)).toBeNull();
        });

        it('should answer a conditional HEAD request with 304', async () => {
            const { etag } = await getValidators();
            const event = createTestEvent('/', { method: 'HEAD', headers: { 'if-none-match': etag } });
            const response = await sendFile(event, buildSendFileOptions(filePath));

            expect(response.status).toEqual(304);
        });

        it('should not answer a conditional POST request with 304', async () => {
            const { etag } = await getValidators();
            const event = createTestEvent('/', { method: 'POST', headers: { 'if-none-match': etag } });
            const response = await sendFile(event, buildSendFileOptions(filePath));

            expect(response.status).toEqual(200);
        });

        it('should not answer with 304 for a file without validators', async () => {
            const event = createTestEvent('/', { headers: { 'if-none-match': '*' } });
            const response = await sendFile(event, {
                stats: { size: 3 },
                content: () => new Uint8Array([1, 2, 3]),
            });

            expect(response.status).toEqual(200);
            expect(response.headers.get(HeaderName.ETag)).toBeNull();
        });

        it('should not answer with 304 for a file with an unparsable mtime', async () => {
            const stats = { size: 3, mtime: 'garbage' };
            const content = () => new Uint8Array([1, 2, 3]);

            const wildcard = await sendFile(
                createTestEvent('/', { headers: { 'if-none-match': '*' } }),
                { stats, content },
            );

            expect(wildcard.status).toEqual(200);

            const exact = await sendFile(
                createTestEvent('/', { headers: { 'if-none-match': 'W/"3-NaN"' } }),
                { stats, content },
            );

            expect(exact.status).toEqual(200);

            const since = await sendFile(
                createTestEvent('/', { headers: { 'if-modified-since': 'Invalid Date' } }),
                { stats, content },
            );

            expect(since.status).toEqual(200);
            expect(new Uint8Array(await since.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
        });
    });
});
