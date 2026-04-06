import { describe, expect, it } from 'vitest';
import { RoutupEvent } from '../../../src/event/module';
import { toResponse } from '../../../src/response/to-response';
import { createTestRequest } from '../../helpers';

describe('src/response/to-response', () => {
    it('should return undefined for undefined', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const result = await toResponse(undefined, event);
        expect(result).toBeUndefined();
    });

    it('should return empty response for null', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const result = await toResponse(null, event);
        expect(result).toBeInstanceOf(Response);
        expect(result!.status).toBe(200);
        expect(await result!.text()).toBe('');
    });

    it('should return custom status for null when set', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        event.response.status = 204;
        event.response.statusText = 'No Content';
        const result = await toResponse(null, event);
        expect(result!.status).toBe(204);
        expect(result!.statusText).toBe('No Content');
    });

    it('should pass through Response as-is', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const original = new Response('custom', { status: 201 });
        const result = await toResponse(original, event);
        expect(result).toBe(original);
    });

    it('should convert string to text/plain response', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const result = await toResponse('hello', event);
        expect(result!.headers.get('content-type')).toBe('text/plain; charset=utf-8');
        expect(await result!.text()).toBe('hello');
        expect(result!.status).toBe(200);
    });

    it('should preserve existing content-type for string', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        event.response.headers.set('content-type', 'text/html');
        const result = await toResponse('<p>hi</p>', event);
        expect(result!.headers.get('content-type')).toBe('text/html');
    });

    it('should convert object to JSON response', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const result = await toResponse({ a: 1 }, event);
        expect(result!.headers.get('content-type')).toBe('application/json; charset=utf-8');
        expect(await result!.json()).toEqual({ a: 1 });
    });

    it('should convert array to JSON response', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const result = await toResponse([1, 2, 3], event);
        expect(await result!.json()).toEqual([1, 2, 3]);
    });

    it('should convert number to JSON response', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const result = await toResponse(42, event);
        expect(await result!.text()).toBe('42');
        expect(result!.headers.get('content-type')).toBe('application/json; charset=utf-8');
    });

    it('should convert ArrayBuffer to binary response', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const buf = new ArrayBuffer(4);
        const result = await toResponse(buf, event);
        expect(result!.headers.get('content-type')).toBe('application/octet-stream');
    });

    it('should convert Uint8Array to binary response', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const arr = new Uint8Array([1, 2, 3]);
        const result = await toResponse(arr, event);
        expect(result!.headers.get('content-type')).toBe('application/octet-stream');
    });

    it('should convert ReadableStream to streaming response', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode('streamed'));
                controller.close();
            },
        });
        const result = await toResponse(stream, event);
        expect(await result!.text()).toBe('streamed');
    });

    it('should convert Blob to response with blob type', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const blob = new Blob(['data'], { type: 'text/csv' });
        const result = await toResponse(blob, event);
        expect(result!.headers.get('content-type')).toBe('text/csv');
    });

    it('should use application/octet-stream for blob without type', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const blob = new Blob(['data']);
        const result = await toResponse(blob, event);
        expect(result!.headers.get('content-type')).toBe('application/octet-stream');
    });

    it('should respect event.response.status', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        event.response.status = 201;
        const result = await toResponse('created', event);
        expect(result!.status).toBe(201);
    });

    it('should respect event.response.headers', async () => {
        const event = new RoutupEvent(createTestRequest('/'));
        event.response.headers.set('x-custom', 'value');
        const result = await toResponse('ok', event);
        expect(result!.headers.get('x-custom')).toBe('value');
    });
});
