import { describe, expect, it } from 'vitest';
import { createFastResponse } from '../../../src/utils';

describe('src/utils/response', () => {
    it('should build a response from a valid init', async () => {
        const response = createFastResponse('body', 201, [['x-a', '1']]);

        expect(response.status).toBe(201);
        expect(response.headers.get('x-a')).toBe('1');
        expect(await response.text()).toBe('body');
    });

    it('should accept a Headers instance', async () => {
        const response = createFastResponse('{}', 200, new Headers({ 'content-type': 'application/json' }));

        expect(response.headers.get('content-type')).toBe('application/json');
        expect(await response.text()).toBe('{}');
    });

    it.each([999, 600, 199, 101, 99, 0, NaN])('should throw a RangeError for status %s', (status) => {
        expect(() => createFastResponse('x', status, [])).toThrow(RangeError);
    });

    it.each([
        [204, 'body'],
        [204, ''],
        [205, 'body'],
        [304, new Uint8Array([1])],
    ])('should throw a TypeError for status %s with a body', (status, body) => {
        expect(() => createFastResponse(body, status, [])).toThrow(TypeError);
    });

    it.each([204, 205, 304])('should accept status %s without a body', (status) => {
        const response = createFastResponse(null, status, []);

        expect(response.status).toBe(status);
    });

    it('should accept a float status inside the range', () => {
        expect(() => createFastResponse('x', 200.5, [])).not.toThrow();
    });
});
