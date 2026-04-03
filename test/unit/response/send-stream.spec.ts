import { describe, expect, it } from 'vitest';
import { Router, coreHandler } from '../../../src';
import { sendStream } from '../../../src/response/helpers/send-stream';
import { createTestRequest } from '../../helpers';

describe('src/response/helpers/send-stream', () => {
    it('should send a readable stream', async () => {
        const router = new Router();

        router.get('/', coreHandler((event) => {
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('hello stream'));
                    controller.close();
                },
            });
            return sendStream(event, stream);
        }));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('hello stream');
    });

    it('should inherit event.response status and headers', async () => {
        const router = new Router();

        router.get('/', coreHandler((event) => {
            event.response.status = 206;
            event.response.statusText = 'Partial Content';
            event.response.headers.set('x-custom', 'stream-header');

            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('partial'));
                    controller.close();
                },
            });
            return sendStream(event, stream);
        }));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toBe(206);
        expect(response.headers.get('x-custom')).toBe('stream-header');
    });
});
