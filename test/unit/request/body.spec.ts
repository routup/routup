import { describe, expect, it } from 'vitest';
import { Router, defineCoreHandler } from '../../../src';
import { readBody } from '../../../src/request/helpers/body';
import { createTestRequest } from '../../helpers';

describe('src/request/helpers/body', () => {
    it('should parse JSON body', async () => {
        const router = new Router();
        let parsed: unknown;

        router.post('/', defineCoreHandler(async (event) => {
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

        router.post('/', defineCoreHandler(async (event) => {
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

        router.post('/', defineCoreHandler(async (event) => {
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

    it('should return undefined for non-JSON content', async () => {
        const router = new Router();
        let parsed: unknown;

        router.post('/', defineCoreHandler(async (event) => {
            parsed = await readBody(event);
            return 'ok';
        }));

        await router.fetch(createTestRequest('/', {
            method: 'POST',
            body: 'plain text',
        }));

        expect(parsed).toBeUndefined();
    });

    it('should attempt JSON parse for unknown content type', async () => {
        const router = new Router();
        let parsed: unknown;

        router.post('/', defineCoreHandler(async (event) => {
            parsed = await readBody(event);
            return 'ok';
        }));

        await router.fetch(createTestRequest('/', {
            method: 'POST',
            body: JSON.stringify({ noHeader: true }),
        }));

        expect(parsed).toEqual({ noHeader: true });
    });

    it('should cache body on repeated reads', async () => {
        const router = new Router();
        let first: unknown;
        let second: unknown;

        router.post('/', defineCoreHandler(async (event) => {
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
        expect(second).toEqual({ cached: true });
    });
});
