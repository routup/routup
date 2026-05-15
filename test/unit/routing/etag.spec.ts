import { describe, expect, it } from 'vitest';
import {
    App,
    defineCoreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/router etag', () => {
    it('should not send etag when disabled', async () => {
        const router = new App({ options: { etag: false } });

        router.get('/', defineCoreHandler(() => 'Hello world!'));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.headers.get('etag')).toBeNull();
        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('Hello world!');
    });

    it('should generate etag for string responses', async () => {
        const router = new App();

        router.get('/', defineCoreHandler(() => 'Hello world!'));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.headers.get('etag')).toBeTruthy();
        expect(response.status).toEqual(200);
    });

    it('should return 304 for matching strong etag', async () => {
        const router = new App();

        router.get('/', defineCoreHandler(() => 'Hello world!'));

        // First request to get the ETag
        const first = await router.fetch(createTestRequest('/'));
        const etag = first.headers.get('etag');
        expect(etag).toBeTruthy();

        // Second request with If-None-Match
        const second = await router.fetch(createTestRequest('/', { headers: { 'if-none-match': etag! } }));

        expect(second.status).toEqual(304);
    });

    it('should return 304 when client sends strong version of weak etag', async () => {
        const router = new App();

        router.get('/', defineCoreHandler(() => 'Hello world!'));

        // First request — server generates weak ETag (W/"...")
        const first = await router.fetch(createTestRequest('/'));
        const etag = first.headers.get('etag');
        expect(etag).toBeTruthy();
        expect(etag!.startsWith('W/')).toBe(true);

        // Client sends the strong version (without W/ prefix)
        const strongEtag = etag!.slice(2);
        const second = await router.fetch(createTestRequest('/', { headers: { 'if-none-match': strongEtag } }));

        expect(second.status).toEqual(304);
    });

    it('should return 304 for wildcard if-none-match', async () => {
        const router = new App();

        router.get('/', defineCoreHandler(() => 'Hello world!'));

        const response = await router.fetch(createTestRequest('/', { headers: { 'if-none-match': '*' } }));

        expect(response.status).toEqual(304);
    });

    it('should return 200 for non-matching etag', async () => {
        const router = new App();

        router.get('/', defineCoreHandler(() => 'Hello world!'));

        const response = await router.fetch(createTestRequest('/', { headers: { 'if-none-match': '"nonexistent"' } }));

        expect(response.status).toEqual(200);
    });
});
