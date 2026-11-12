import { describe, expect, it } from 'vitest';
import { toResponse } from '../../../src/response/to-response';
import { createTestEvent } from '../../helpers';

describe('src/response/to-response', () => {
    it('should return undefined for undefined', async () => {
        const event = createTestEvent('/');
        const result = await toResponse(undefined, event);

        expect(result).toBeUndefined();
    });

    it('should return empty response for null', async () => {
        const event = createTestEvent('/');
        const result = await toResponse(null, event);

        expect(result).toBeInstanceOf(Response);
        expect(result!.status).toBe(200);
        expect(await result!.text()).toBe('');
    });

    it('should return custom status for null when set', async () => {
        const event = createTestEvent('/');

        event.response.status = 204;

        const result = await toResponse(null, event);

        expect(result!.status).toBe(204);
    });

    it('should pass through Response as-is', async () => {
        const event = createTestEvent('/');
        const original = new Response('custom', { status: 201 });
        const result = await toResponse(original, event);

        expect(result).toBe(original);
    });

    it('should convert string to text/plain response', async () => {
        const event = createTestEvent('/');
        const result = await toResponse('hello', event);

        expect(result!.headers.get('content-type')).toBe('text/plain; charset=utf-8');
        expect(await result!.text()).toBe('hello');
        expect(result!.status).toBe(200);
    });

    it('should preserve existing content-type for string', async () => {
        const event = createTestEvent('/');

        event.response.headers.set('content-type', 'text/html');

        const result = await toResponse('<p>hi</p>', event);

        expect(result!.headers.get('content-type')).toBe('text/html');
    });

    it('should convert object to JSON response', async () => {
        const event = createTestEvent('/');
        const result = await toResponse({ a: 1 }, event);

        expect(result!.headers.get('content-type')).toBe('application/json; charset=utf-8');
        expect(await result!.json()).toEqual({ a: 1 });
    });

    it('should convert array to JSON response', async () => {
        const event = createTestEvent('/');
        const result = await toResponse([1, 2, 3], event);

        expect(await result!.json()).toEqual([1, 2, 3]);
    });

    it('should convert number to JSON response', async () => {
        const event = createTestEvent('/');
        const result = await toResponse(42, event);

        expect(await result!.text()).toBe('42');
        expect(result!.headers.get('content-type')).toBe('application/json; charset=utf-8');
    });

    it('should convert ArrayBuffer to binary response', async () => {
        const event = createTestEvent('/');
        const buf = new ArrayBuffer(4);
        const result = await toResponse(buf, event);

        expect(result!.headers.get('content-type')).toBe('application/octet-stream');
    });

    it('should convert Uint8Array to binary response', async () => {
        const event = createTestEvent('/');
        const arr = new Uint8Array([1, 2, 3]);
        const result = await toResponse(arr, event);

        expect(result!.headers.get('content-type')).toBe('application/octet-stream');
    });

    it('should snapshot a Uint8Array body', async () => {
        const event = createTestEvent('/');
        const arr = new Uint8Array([1, 2, 3]);
        const result = await toResponse(arr, event);

        arr.fill(0);

        expect([...new Uint8Array(await result!.arrayBuffer())]).toEqual([1, 2, 3]);
    });

    it('should snapshot an ArrayBuffer body', async () => {
        const event = createTestEvent('/');
        const arr = new Uint8Array([4, 5, 6]);
        const result = await toResponse(arr.buffer, event);

        arr.fill(0);

        expect([...new Uint8Array(await result!.arrayBuffer())]).toEqual([4, 5, 6]);
    });

    it('should send exactly the bytes of a Uint8Array view', async () => {
        const event = createTestEvent('/');
        const backing = new Uint8Array([9, 1, 2, 3, 9]);
        const view = backing.subarray(1, 4);
        const result = await toResponse(view, event);

        backing.fill(0);

        expect([...new Uint8Array(await result!.arrayBuffer())]).toEqual([1, 2, 3]);
    });

    it('should convert ReadableStream to streaming response', async () => {
        const event = createTestEvent('/');
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
        const event = createTestEvent('/');
        const blob = new Blob(['data'], { type: 'text/csv' });
        const result = await toResponse(blob, event);

        expect(result!.headers.get('content-type')).toBe('text/csv');
    });

    it('should use application/octet-stream for blob without type', async () => {
        const event = createTestEvent('/');
        const blob = new Blob(['data']);
        const result = await toResponse(blob, event);

        expect(result!.headers.get('content-type')).toBe('application/octet-stream');
    });

    it('should respect event.response.status', async () => {
        const event = createTestEvent('/');

        event.response.status = 201;

        const result = await toResponse('created', event);

        expect(result!.status).toBe(201);
    });

    it('should respect event.response.headers', async () => {
        const event = createTestEvent('/');

        event.response.headers.set('x-custom', 'value');

        const result = await toResponse('ok', event);

        expect(result!.headers.get('x-custom')).toBe('value');
    });

    it.each([
        ['string', 'ok'],
        ['object', { ok: true }],
        ['null', null],
        ['binary', new Uint8Array([1, 2, 3])],
    ])('should snapshot the headers into a %s response', async (_label, value) => {
        const event = createTestEvent('/');

        event.response.headers.set('x-early', '1');

        const result = await toResponse(value, event);

        // A middleware touching the accumulator after the response was
        // built must not rewrite that response.
        event.response.headers.set('x-late', '1');
        event.response.headers.delete('x-early');

        expect(result!.headers.get('x-early')).toBe('1');
        expect(result!.headers.has('x-late')).toBe(false);
    });

    it('should keep every set-cookie value', async () => {
        const event = createTestEvent('/');

        event.response.headers.append('set-cookie', 'a=1');
        event.response.headers.append('set-cookie', 'b=2');

        const result = await toResponse('ok', event);

        expect(result!.headers.getSetCookie()).toEqual(['a=1', 'b=2']);
    });

    it('should build responses that can be cloned and re-wrapped', async () => {
        const event = createTestEvent('/');

        event.response.status = 201;

        const result = await toResponse({ ok: true }, event);
        const clone = result!.clone();
        const rewrapped = new Response(result!.body, result!);

        expect(clone.status).toBe(201);
        expect(await clone.json()).toEqual({ ok: true });
        expect(rewrapped.status).toBe(201);
        expect(rewrapped.headers.get('content-type')).toBe('application/json; charset=utf-8');
        expect(await rewrapped.json()).toEqual({ ok: true });
    });

    it('should throw AppError when JSON.stringify fails', async () => {
        const event = createTestEvent('/');
        const circular: Record<string, unknown> = {};

        circular.self = circular;

        try {
            await toResponse(circular, event);
            expect.unreachable('should have thrown');
        } catch (e: any) {
            expect(e.status).toBe(500);
            expect(e.message).toBe('JSON serialization failed');
            expect(e.cause).toBeInstanceOf(TypeError);
        }
    });

    it.each([
        ['a string with status 999', 999, 'x', RangeError],
        ['an object with status 0', 0, { a: 1 }, RangeError],
        ['an empty string with status 204', 204, '', TypeError],
        ['a Uint8Array with status 304', 304, new Uint8Array([1]), TypeError],
    ])('should throw the platform error for %s', async (_label, status, value, type) => {
        const event = createTestEvent('/');

        event.response.status = status;

        // `toResponse` throws synchronously or rejects depending on
        // whether an ETag is computed; the async wrapper covers both.
        await expect((async () => toResponse(value, event))()).rejects.toThrow(type);
    });

    it('should still build a 204 for null', async () => {
        const event = createTestEvent('/');

        event.response.status = 204;

        const result = await toResponse(null, event);

        expect(result!.status).toBe(204);
    });
});
