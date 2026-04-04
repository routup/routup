import { describe, expect, it } from 'vitest';
import {
    Router,
    coreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('routing/parameters', () => {
    it('should capture parameters', async () => {
        const router = new Router();

        router.get('/:id/:action', coreHandler(async (event) => event.params));

        const response = await router.fetch(createTestRequest('/123/run'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({
            id: '123',
            action: 'run',
        });
    });

    it('should pass on captured parameters', async () => {
        const router = new Router({ path: '/:id' });

        router.get('/:action', coreHandler(async (event) => event.params));

        const response = await router.fetch(createTestRequest('/123/run'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({
            id: '123',
            action: 'run',
        });
    });
});
