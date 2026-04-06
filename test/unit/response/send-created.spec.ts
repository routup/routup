import { describe, expect, it } from 'vitest';
import { Router, defineCoreHandler } from '../../../src';
import { sendCreated } from '../../../src/response/helpers/send-created';
import { createTestRequest } from '../../helpers';

describe('src/response/helpers/send-created', () => {
    it('should send 201 with data', async () => {
        const router = new Router();

        router.post('/', defineCoreHandler(async (event) => sendCreated(event, { id: 1 })));

        const response = await router.fetch(createTestRequest('/', { method: 'POST' }));

        expect(response.status).toBe(201);
        expect(await response.json()).toEqual({ id: 1 });
    });

    it('should send 201 without data', async () => {
        const router = new Router();

        router.post('/', defineCoreHandler(async (event) => sendCreated(event)));

        const response = await router.fetch(createTestRequest('/', { method: 'POST' }));

        expect(response.status).toBe(201);
        expect(await response.text()).toBe('');
    });

    it('should send 201 with string data', async () => {
        const router = new Router();

        router.post('/', defineCoreHandler(async (event) => sendCreated(event, 'Created successfully')));

        const response = await router.fetch(createTestRequest('/', { method: 'POST' }));

        expect(response.status).toBe(201);
        expect(await response.text()).toBe('Created successfully');
    });
});
