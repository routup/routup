import { describe, expect, it } from 'vitest';
import { Router, coreHandler } from '../../../src';
import { readBody, readRawBody, readFormData } from '../../../src/request/helpers/body';
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

    it('should parse URL-encoded body', async () => {
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

    it('should cache body on repeated reads', async () => {
        const router = new Router();
        let first: unknown;
        let second: unknown;

        router.post('/', coreHandler(async (event) => {
            first = await readBody(event);
            second = await readBody(event);
            return 'ok';
        }));

        await router.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ cached: true }),
        }));

        expect(first).toEqual({ cached: true });
        expect(second).toBe(first);
    });

    it('should read raw body as ArrayBuffer', async () => {
        const router = new Router();
        let raw: ArrayBuffer | undefined;

        router.post('/', coreHandler(async (event) => {
            raw = await readRawBody(event);
            return 'ok';
        }));

        await router.fetch(createTestRequest('/', {
            method: 'POST',
            body: 'raw data',
        }));

        expect(raw).toBeInstanceOf(ArrayBuffer);
        expect(new TextDecoder().decode(raw!)).toBe('raw data');
    });
});
