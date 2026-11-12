import { describe, expect, it } from 'vitest';
import {
    App,
    defineCoreHandler,
    defineErrorHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/app/timeout', () => {
    describe('global (timeout)', () => {
        it('should return normal response when handler completes before timeout', async () => {
            const router = new App({ options: { timeout: 1000 } });

            router.use(defineCoreHandler(() => 'ok'));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe('ok');
        });

        it('should return 408 when handler exceeds timeout', async () => {
            const router = new App({ options: { timeout: 50 } });

            router.use(defineCoreHandler(async () => {
                await new Promise((resolve) => {
                    setTimeout(resolve, 200);
                });

                return 'too late';
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(408);
        });

        it('should abort signal when timeout is exceeded', async () => {
            const router = new App({ options: { timeout: 50 } });
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
            const router = new App({ options: { timeout: 1000 } });
            let signalAborted = true;

            router.use(defineCoreHandler((event) => {
                signalAborted = event.signal.aborted;

                return 'ok';
            }));

            await router.fetch(createTestRequest('/'));

            expect(signalAborted).toBe(false);
        });

        it('should not apply timeout when option is not set', async () => {
            const router = new App();

            router.use(defineCoreHandler(async () => {
                await new Promise((resolve) => {
                    setTimeout(resolve, 10);
                });

                return 'ok';
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe('ok');
        });

        it('should provide a default signal when no timeout is set', async () => {
            const router = new App();
            let hasSignal = false;

            router.use(defineCoreHandler((event) => {
                hasSignal = event.signal instanceof AbortSignal;

                return 'ok';
            }));

            await router.fetch(createTestRequest('/'));

            expect(hasSignal).toBe(true);
        });

        it('should ignore invalid timeout values', async () => {
            const router = new App({ options: { timeout: -100 } });

            router.use(defineCoreHandler(() => 'ok'));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe('ok');
        });
    });

    describe('per-handler (handlerTimeout)', () => {
        it('should apply handlerTimeout as default for all handlers', async () => {
            const router = new App({ options: { handlerTimeout: 50 } });

            router.use(defineCoreHandler(async () => {
                await new Promise((resolve) => {
                    setTimeout(resolve, 200);
                });

                return 'too late';
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(408);
        });

        it('should allow handler to set shorter timeout than handlerTimeout', async () => {
            const router = new App({ options: { handlerTimeout: 500 } });

            router.use(defineCoreHandler({
                timeout: 50,
                fn: async () => {
                    await new Promise((resolve) => {
                        setTimeout(resolve, 200);
                    });

                    return 'too late';
                },
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(408);
        });

        it('should not allow handler to extend timeout when not overridable', async () => {
            const router = new App({ options: { handlerTimeout: 50 } });

            router.use(defineCoreHandler({
                timeout: 500,
                fn: async () => {
                    await new Promise((resolve) => {
                        setTimeout(resolve, 200);
                    });

                    return 'too late';
                },
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(408);
        });

        it('should allow handler to extend timeout when overridable', async () => {
            const router = new App({
                options: {
                    handlerTimeout: 50,
                    handlerTimeoutOverridable: true,
                },
            });

            router.use(defineCoreHandler({
                timeout: 500,
                fn: async () => {
                    await new Promise((resolve) => {
                        setTimeout(resolve, 100);
                    });

                    return 'extended ok';
                },
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe('extended ok');
        });

        it('should use handler timeout when no handlerTimeout is set on router', async () => {
            const router = new App();

            router.use(defineCoreHandler({
                timeout: 50,
                fn: async () => {
                    await new Promise((resolve) => {
                        setTimeout(resolve, 200);
                    });

                    return 'too late';
                },
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(408);
        });

        it('should abort signal when per-handler timeout is exceeded', async () => {
            const router = new App({ options: { handlerTimeout: 50 } });
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
            const router = new App();
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
            const router = new App({ options: { handlerTimeout: 1000 } });
            let signalAborted = true;

            router.use(defineCoreHandler((event) => {
                signalAborted = event.signal.aborted;

                return 'ok';
            }));

            await router.fetch(createTestRequest('/'));

            expect(signalAborted).toBe(false);
        });

        it('should propagate parent signal abort to handler signal', async () => {
            const router = new App({ options: { timeout: 50, handlerTimeout: 500 } });
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
            const router = new App();

            router.use(defineCoreHandler(async () => {
                await new Promise((resolve) => {
                    setTimeout(resolve, 10);
                });

                return 'ok';
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe('ok');
        });

        it('should apply global timeout even when handler timeout is longer', async () => {
            const router = new App({
                options: {
                    timeout: 50,
                    handlerTimeout: 500,
                    handlerTimeoutOverridable: true,
                },
            });

            router.use(defineCoreHandler({
                timeout: 500,
                fn: async () => {
                    await new Promise((resolve) => {
                        setTimeout(resolve, 200);
                    });

                    return 'too late';
                },
            }));

            const response = await router.fetch(createTestRequest('/'));

            expect(response.status).toBe(408);
        });
    });

    describe('late next() after a per-handler timeout', () => {
        const sleep = (ms: number) => new Promise<void>((resolve) => {
            setTimeout(resolve, ms);
        });

        it('should not re-enter an error handler that is still running', async () => {
            // Overridable, so the error handler can outlive the 20ms
            // default that the middleware runs under.
            const app = new App({
                options: {
                    handlerTimeout: 20,
                    handlerTimeoutOverridable: true,
                },
            });
            const entered: number[] = [];
            let routeDispatched = 0;
            let lateResult: Response | undefined | null = null;
            let lateSettled!: () => void;
            const late = new Promise<void>((resolve) => {
                lateSettled = resolve;
            });

            app.use(defineCoreHandler(async (event) => {
                await sleep(60);

                // The handler timed out at 20ms; this call comes late.
                const pending = event.next();

                expect(event.nextCalled).toBe(true);
                expect(event.nextResult).toBe(pending);

                lateResult = await pending;
                lateSettled();

                return lateResult;
            }));

            app.get('/', defineCoreHandler(() => {
                routeDispatched++;

                return 'route';
            }));

            app.use(defineErrorHandler({
                timeout: 1000,
                fn: async (error, event) => {
                    entered.push(error.status);

                    // Still in flight when the late next() arrives.
                    await sleep(120);

                    event.response.status = error.status;

                    return 'handled';
                },
            }));

            const response = await app.fetch(createTestRequest('/'));

            await late;

            expect(entered).toEqual([408]);
            expect(routeDispatched).toBe(0);
            expect(lateResult).toBeUndefined();
            expect(response.status).toBe(408);
            expect(await response.text()).toBe('handled');
        });

        it('should still reach a later error handler when a timed handler throws after next()', async () => {
            const app = new App({ options: { handlerTimeout: 500 } });
            const entered: string[] = [];

            app.use(defineCoreHandler(async (event) => {
                await event.next();

                throw new Error('post-next failure');
            }));

            app.use(defineCoreHandler((event) => event.next()));

            app.use(defineErrorHandler((error) => {
                entered.push(error.message);

                return 'handled';
            }));

            const response = await app.fetch(createTestRequest('/'));

            expect(entered).toEqual(['post-next failure']);
            expect(await response.text()).toBe('handled');
        });
    });
});
