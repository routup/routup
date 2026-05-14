import { describe, expect, it } from 'vitest';
import {
    App,
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
