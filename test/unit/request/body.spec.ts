import { describe, expect, it } from 'vitest';
import { Router, coreHandler } from '../../../src';
import { readBody } from '../../../src/request/helpers/body';
import { createTestRequest } from '../../helpers';

describe('src/request/helpers/body', () => {
    it('should parse JSON body', async () => {
        const router = new Router();
        let parsed: unknown;

        router.post('/', coreHandler(async (event) => {
            parsed = await readBody(event);
            return 'ok';
        }));

        await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ key: 'value' }),
        }));

        expect(parsed).toEqual({ key: 'value' });
    });

    it('should parse URL-encoded body as plain object', async () => {
        const router = new Router();
        let parsed: unknown;

        router.post('/', coreHandler(async (event) => {
            parsed = await readBody(event);
            return 'ok';
        }));

        await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: 'name=hello&value=world',
        }));

        expect(parsed).toEqual({ name: 'hello', value: 'world' });
    });

    it('should parse URL-encoded duplicate keys as arrays', async () => {
        const router = new Router();
        let parsed: unknown;

        router.post('/', coreHandler(async (event) => {
            parsed = await readBody(event);
            return 'ok';
        }));

        await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: 'tags=a&tags=b&tags=c&name=hello',
        }));

        expect(parsed).toEqual({ tags: ['a', 'b', 'c'], name: 'hello' });
    });

    it('should return text for unknown content type', async () => {
        const router = new Router();
        let parsed: unknown;

        router.post('/', coreHandler(async (event) => {
            parsed = await readBody(event);
            return 'ok';
        }));

        await router.fetch(createTestRequest('/', {
            method: 'POST',
            body: 'plain text',
        }));

        expect(parsed).toBe('plain text');
    });

    it('should read body as ArrayBuffer with explicit type', async () => {
        const router = new Router();
        let raw: ArrayBuffer | undefined;

        router.post('/', coreHandler(async (event) => {
            raw = await readBody(event, { type: 'arrayBuffer' });
            return 'ok';
        }));

        await router.fetch(createTestRequest('/', {
            method: 'POST',
            body: 'raw data',
        }));

        expect(raw).toBeInstanceOf(ArrayBuffer);
        expect(new TextDecoder().decode(raw!)).toBe('raw data');
    });

    it('should read body as text with explicit type', async () => {
        const router = new Router();
        let text: string | undefined;

        router.post('/', coreHandler(async (event) => {
            text = await readBody(event, { type: 'text' });
            return 'ok';
        }));

        await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ key: 'value' }),
        }));

        expect(text).toBe('{"key":"value"}');
    });

    it('should read body as JSON with explicit type', async () => {
        const router = new Router();
        let parsed: unknown;

        router.post('/', coreHandler(async (event) => {
            parsed = await readBody(event, { type: 'json' });
            return 'ok';
        }));

        await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ explicit: true }),
        }));

        expect(parsed).toEqual({ explicit: true });
    });
});
