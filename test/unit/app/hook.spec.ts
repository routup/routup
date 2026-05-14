import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    App,
    defineCoreHandler,
    defineErrorHandler,
} from '../../../src';
import type { HookDefaultListener } from '../../../src/hook';
import { HookName } from '../../../src/hook';
import { createTestRequest } from '../../helpers';

describe('src/router/hooks', () => {
    it('should trigger non error hooks', async () => {
        const router = new App();
        router.use(defineCoreHandler(() => 'Hello, World!'));

        const request = vi.fn();
        const response = vi.fn();
        const error = vi.fn();
        const childMatch = vi.fn();
        const childBefore = vi.fn();
        const childAfter = vi.fn();

        router.on(HookName.START, () => { request(); });
        router.on(HookName.END, () => { response(); });
        router.on(HookName.ERROR, () => { error(); });
        router.on(HookName.CHILD_MATCH, () => { childMatch(); });
        router.on(HookName.CHILD_DISPATCH_BEFORE, () => { childBefore(); });
        router.on(HookName.CHILD_DISPATCH_AFTER, () => { childAfter(); });

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('Hello, World!');

        expect(error).not.toHaveBeenCalled();
        expect(request).toHaveBeenCalledTimes(1);
        expect(response).toHaveBeenCalledTimes(1);
        expect(childMatch).toHaveBeenCalledTimes(1);
        expect(childBefore).toHaveBeenCalledTimes(1);
        expect(childAfter).toHaveBeenCalledTimes(1);
    });

    it('should trigger error hook', async () => {
        const router = new App();
        router.use(defineCoreHandler(() => {
            throw new Error('Hello, World!');
        }));

        const errorFn = vi.fn();
        const requestFn = vi.fn();
        const responseFn = vi.fn();

        router.on(HookName.START, () => { requestFn(); });
        router.on(HookName.END, () => { responseFn(); });
        router.on(HookName.ERROR, () => { errorFn(); });

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(500);

        expect(errorFn).toHaveBeenCalledTimes(1);
        expect(requestFn).toHaveBeenCalledTimes(1);
        expect(responseFn).toHaveBeenCalledTimes(1);
    });

    it('should remove multiple hooks', async () => {
        const router = new App();
        router.use(defineCoreHandler(() => 'Hello, World!'));

        const fn = vi.fn();

        const hooks = Object.values(HookName);
        for (const hook of hooks) {
            router.on(hook as any, () => { fn(); });
        }

        for (const hook of hooks) {
            router.off(hook);
        }

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('Hello, World!');
        expect(fn).not.toHaveBeenCalled();
    });

    it('should remove error hook and fall through to default error handling', async () => {
        const router = new App();
        router.use(defineCoreHandler(() => {
            throw new Error('fail');
        }));

        const fn = vi.fn();
        router.on(HookName.ERROR, () => { fn(); });
        router.off(HookName.ERROR);

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(500);
        expect(fn).not.toHaveBeenCalled();
    });

    it('should remove single hook', async () => {
        const router = new App();
        router.use(defineCoreHandler(() => 'Hello, World!'));

        const fnJest = vi.fn();
        const fn: HookDefaultListener = () => {
            fnJest();
        };

        router.on(HookName.START, fn);
        router.off(HookName.START, fn);

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('Hello, World!');

        expect(fnJest).not.toHaveBeenCalled();
    });

    it('should handle error with error handler', async () => {
        const router = new App();

        router.use(defineCoreHandler(() => {
            throw new Error('handler failed!');
        }));

        router.use(defineErrorHandler((error) => `Error: ${error.message}`));

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('Error: handler failed!');
    });

    it('should remove single hook by unsubscribe', async () => {
        const router = new App();
        router.use(defineCoreHandler(() => 'Hello, World!'));

        const fnJest = vi.fn();
        const fn: HookDefaultListener = () => {
            fnJest();
        };

        const unsubscribe = router.on(HookName.START, fn);
        unsubscribe();

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('Hello, World!');

        expect(fnJest).not.toHaveBeenCalled();
    });

    it('should trigger handler error hook', async () => {
        const router = new App();

        const onErrorFn = vi.fn();

        router.use(defineCoreHandler({
            fn: () => {
                throw new Error('Hello, World!');
            },
            onError() {
                onErrorFn();
            },
        }));

        router.use(defineErrorHandler((error) => `Error: ${error.message}`));

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('Error: Hello, World!');
        expect(onErrorFn).toHaveBeenCalled();
    });

    it('should execute hooks in priority order (higher first)', async () => {
        const router = new App();
        router.use(defineCoreHandler(() => 'ok'));

        const order: number[] = [];

        router.on(HookName.START, () => { order.push(1); }, 0);
        router.on(HookName.START, () => { order.push(2); }, 10);
        router.on(HookName.START, () => { order.push(3); }, 5);

        await router.fetch(createTestRequest('/'));

        expect(order).toEqual([2, 3, 1]);
    });

    it('should execute hooks with same priority in registration order', async () => {
        const router = new App();
        router.use(defineCoreHandler(() => 'ok'));

        const order: string[] = [];

        router.on(HookName.START, () => { order.push('first'); });
        router.on(HookName.START, () => { order.push('second'); });
        router.on(HookName.START, () => { order.push('third'); });

        await router.fetch(createTestRequest('/'));

        expect(order).toEqual(['first', 'second', 'third']);
    });

    it('should support negative priority', async () => {
        const router = new App();
        router.use(defineCoreHandler(() => 'ok'));

        const order: string[] = [];

        router.on(HookName.START, () => { order.push('default'); }, 0);
        router.on(HookName.START, () => { order.push('late'); }, -10);
        router.on(HookName.START, () => { order.push('early'); }, 10);

        await router.fetch(createTestRequest('/'));

        expect(order).toEqual(['early', 'default', 'late']);
    });

    it('should trigger handler hooks', async () => {
        const router = new App();

        const onBefore = vi.fn();
        const onAfter = vi.fn();

        router.use(defineCoreHandler({
            fn: () => 'Hello, World!',
            onBefore() {
                onBefore();
            },
            onAfter() {
                onAfter();
            },
        }));

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('Hello, World!');

        expect(onBefore).toHaveBeenCalled();
        expect(onAfter).toHaveBeenCalled();
    });

    it('should fire REQUEST and RESPONSE exactly once when middleware calls event.next()', async () => {
        const router = new App();
        router.use(defineCoreHandler(async (event) => event.next()));
        router.use(defineCoreHandler(() => 'ok'));

        const request = vi.fn();
        const response = vi.fn();

        router.on(HookName.START, () => { request(); });
        router.on(HookName.END, () => { response(); });

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('ok');
        expect(request).toHaveBeenCalledTimes(1);
        expect(response).toHaveBeenCalledTimes(1);
    });

    it('should re-LOOKUP when CHILD_MATCH rewrites event.path', async () => {
        // A CHILD_MATCH listener that mutates `event.path` must force
        // the pipeline to refresh its match cache; the dispatched
        // handler is the one registered at the *new* path.
        const router = new App();
        router.get('/original', defineCoreHandler(() => 'wrong'));
        router.get('/rewritten', defineCoreHandler(() => 'right'));

        router.on(HookName.CHILD_MATCH, (event) => {
            if (event.path === '/original') {
                event.path = '/rewritten';
            }
        });

        const res = await router.fetch(createTestRequest('/original'));
        expect(await res.text()).toEqual('right');
    });

    it('should re-LOOKUP when CHILD_DISPATCH_BEFORE rewrites event.path', async () => {
        const router = new App();
        router.get('/a', defineCoreHandler(() => 'wrong'));
        router.get('/b', defineCoreHandler(() => 'right'));

        router.on(HookName.CHILD_DISPATCH_BEFORE, (event) => {
            if (event.path === '/a') {
                event.path = '/b';
            }
        });

        const res = await router.fetch(createTestRequest('/a'));
        expect(await res.text()).toEqual('right');
    });
});
