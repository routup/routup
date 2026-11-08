import { describe, expect, it } from 'vitest';
import type { Handler } from '../../../src';
import {
    App,
    LinearRouter,
    TrieRouter,
    defineCoreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('routing/parameters', () => {
    it('should capture parameters', async () => {
        const router = new App();

        router.get('/:id/:action', defineCoreHandler(async (event) => event.params));

        const response = await router.fetch(createTestRequest('/123/run'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({
            id: '123',
            action: 'run',
        });
    });

    it.each([
        ['LinearRouter', () => new LinearRouter<Handler>()],
        ['TrieRouter', () => new TrieRouter<Handler>()],
    ])('should make the last parameter of a segment greedy (%s)', async (_name, createRouter) => {
        const router = new App({ router: createRouter() });

        router.get('/:file.:ext', defineCoreHandler(async (event) => event.params));

        const response = await router.fetch(createTestRequest('/foo.json.html'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({
            file: 'foo',
            ext: 'json.html',
        });
    });

    it('should pass on captured parameters through nested mount', async () => {
        const inner = new App();

        inner.get('/:action', defineCoreHandler(async (event) => event.params));

        const router = new App();

        router.use('/:id', inner);

        const response = await router.fetch(createTestRequest('/123/run'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({
            id: '123',
            action: 'run',
        });
    });
});
