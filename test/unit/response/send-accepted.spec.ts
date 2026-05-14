import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler } from '../../../src';
import { sendAccepted } from '../../../src/response/helpers/send-accepted';
import { createTestRequest } from '../../helpers';

describe('src/response/helpers/send-accepted', () => {
    it('should send 202 with data', async () => {
        const router = new App();

        router.post('/', defineCoreHandler(async (event) => sendAccepted(event, { status: 'processing' })));

        const response = await router.fetch(createTestRequest('/', { method: 'POST' }));

        expect(response.status).toBe(202);
        expect(await response.json()).toEqual({ status: 'processing' });
    });

    it('should send 202 without data', async () => {
        const router = new App();

        router.post('/', defineCoreHandler(async (event) => sendAccepted(event)));

        const response = await router.fetch(createTestRequest('/', { method: 'POST' }));

        expect(response.status).toBe(202);
        expect(await response.text()).toBe('');
    });
});
