import { describe, expect, it } from 'vitest';
import {
    Router,
    defineCoreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/router/timeout', () => {
    it('should return normal response when handler completes before timeout', async () => {
        const router = new Router({ timeout: 1000 });

        router.use(defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('ok');
    });

    it('should return 408 when handler exceeds timeout', async () => {
        const router = new Router({ timeout: 50 });

        router.use(defineCoreHandler(async () => {
            await new Promise((resolve) => { setTimeout(resolve, 200); });
            return 'too late';
        }));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toBe(408);
    });

    it('should abort signal when timeout is exceeded', async () => {
        const router = new Router({ timeout: 50 });
        let signalAborted = false;

        router.use(defineCoreHandler(async (event) => {
            await new Promise<void>((resolve) => {
                event.signal.addEventListener('abort', () => {
                    signalAborted = true;
                    resolve();
                });
            });
            return 'too late';
        }));

        await router.fetch(createTestRequest('/'));

        expect(signalAborted).toBe(true);
    });

    it('should provide non-aborted signal to handlers within timeout', async () => {
        const router = new Router({ timeout: 1000 });
        let signalAborted = true;

        router.use(defineCoreHandler((event) => {
            signalAborted = event.signal.aborted;
            return 'ok';
        }));

        await router.fetch(createTestRequest('/'));

        expect(signalAborted).toBe(false);
    });

    it('should not apply timeout when option is not set', async () => {
        const router = new Router();

        router.use(defineCoreHandler(async () => {
            await new Promise((resolve) => { setTimeout(resolve, 10); });
            return 'ok';
        }));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('ok');
    });

    it('should provide a default signal when no timeout is set', async () => {
        const router = new Router();
        let hasSignal = false;

        router.use(defineCoreHandler((event) => {
            hasSignal = event.signal instanceof AbortSignal;
            return 'ok';
        }));

        await router.fetch(createTestRequest('/'));

        expect(hasSignal).toBe(true);
    });

    it('should ignore invalid timeout values', async () => {
        const router = new Router({ timeout: -100 });

        router.use(defineCoreHandler(() => 'ok'));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('ok');
    });
});
