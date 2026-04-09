import { describe, expect, it } from 'vitest';
import {
    Router,
    defineCoreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/router/timeout', () => {
    describe('global (timeout)', () => {
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

    describe('per-handler (handlerTimeout)', () => {
        it('should apply handlerTimeout as default for all handlers', async () => {
            const router = new Router({ handlerTimeout: 50 });

            router.use(defineCoreHandler(async () => {
                await new Promise((resolve) => { setTimeout(resolve, 200); });
                return 'too late';
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(408);
        });

        it('should allow handler to set shorter timeout than handlerTimeout', async () => {
            const router = new Router({ handlerTimeout: 500 });

            router.use(defineCoreHandler({
                timeout: 50,
                fn: async () => {
                    await new Promise((resolve) => { setTimeout(resolve, 200); });
                    return 'too late';
                },
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(408);
        });

        it('should not allow handler to extend timeout when not overridable', async () => {
            const router = new Router({ handlerTimeout: 50 });

            router.use(defineCoreHandler({
                timeout: 500,
                fn: async () => {
                    await new Promise((resolve) => { setTimeout(resolve, 200); });
                    return 'too late';
                },
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(408);
        });

        it('should allow handler to extend timeout when overridable', async () => {
            const router = new Router({
                handlerTimeout: 50,
                handlerTimeoutOverridable: true,
            });

            router.use(defineCoreHandler({
                timeout: 500,
                fn: async () => {
                    await new Promise((resolve) => { setTimeout(resolve, 100); });
                    return 'extended ok';
                },
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe('extended ok');
        });

        it('should use handler timeout when no handlerTimeout is set on router', async () => {
            const router = new Router();

            router.use(defineCoreHandler({
                timeout: 50,
                fn: async () => {
                    await new Promise((resolve) => { setTimeout(resolve, 200); });
                    return 'too late';
                },
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(408);
        });

        it('should abort signal when per-handler timeout is exceeded', async () => {
            const router = new Router({ handlerTimeout: 50 });
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

        it('should abort signal when handler-level timeout is exceeded', async () => {
            const router = new Router();
            let signalAborted = false;

            router.use(defineCoreHandler({
                timeout: 50,
                fn: async (event) => {
                    await new Promise<void>((resolve) => {
                        event.signal.addEventListener('abort', () => {
                            signalAborted = true;
                            resolve();
                        });
                    });
                    return 'too late';
                },
            }));

            await router.fetch(createTestRequest('/'));

            expect(signalAborted).toBe(true);
        });

        it('should provide non-aborted signal when handler completes before timeout', async () => {
            const router = new Router({ handlerTimeout: 1000 });
            let signalAborted = true;

            router.use(defineCoreHandler((event) => {
                signalAborted = event.signal.aborted;
                return 'ok';
            }));

            await router.fetch(createTestRequest('/'));

            expect(signalAborted).toBe(false);
        });

        it('should propagate parent signal abort to handler signal', async () => {
            const router = new Router({ timeout: 50, handlerTimeout: 500 });
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

        it('should not affect handlers without timeout when handlerTimeout is unset', async () => {
            const router = new Router();

            router.use(defineCoreHandler(async () => {
                await new Promise((resolve) => { setTimeout(resolve, 10); });
                return 'ok';
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe('ok');
        });

        it('should apply global timeout even when handler timeout is longer', async () => {
            const router = new Router({
                timeout: 50,
                handlerTimeout: 500,
                handlerTimeoutOverridable: true,
            });

            router.use(defineCoreHandler({
                timeout: 500,
                fn: async () => {
                    await new Promise((resolve) => { setTimeout(resolve, 200); });
                    return 'too late';
                },
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(408);
        });
    });
});
