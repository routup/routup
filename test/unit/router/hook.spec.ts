import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    Router,
    coreHandler,
    errorHandler,
} from '../../../src';
import type { HookDefaultListener } from '../../../src/hook';
import { HookName } from '../../../src/hook';
import { createTestRequest } from '../../helpers';

describe('src/router/hooks', () => {
    it('should trigger non error hooks', async () => {
        const router = new Router();
        router.use(coreHandler(() => 'Hello, World!'));

        const request = vi.fn();
        const response = vi.fn();
        const error = vi.fn();
        const childMatch = vi.fn();
        const childBefore = vi.fn();
        const childAfter = vi.fn();

        router.on(HookName.REQUEST, () => { request(); });
        router.on(HookName.RESPONSE, () => { response(); });
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
        const router = new Router();
        router.use(coreHandler(() => {
            throw new Error('Hello, World!');
        }));

        const errorFn = vi.fn();
        const requestFn = vi.fn();
        const responseFn = vi.fn();

        router.on(HookName.REQUEST, () => { requestFn(); });
        router.on(HookName.RESPONSE, () => { responseFn(); });
        router.on(HookName.ERROR, () => { errorFn(); });

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(500);

        expect(errorFn).toHaveBeenCalledTimes(1);
        expect(requestFn).toHaveBeenCalledTimes(1);
        expect(responseFn).toHaveBeenCalledTimes(1);
    });

    it('should remove multiple hooks', async () => {
        const router = new Router();
        router.use(coreHandler(() => 'Hello, World!'));

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
        const router = new Router();
        router.use(coreHandler(() => {
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
        const router = new Router();
        router.use(coreHandler(() => 'Hello, World!'));

        const fnJest = vi.fn();
        const fn: HookDefaultListener = () => {
            fnJest();
        };

        router.on(HookName.REQUEST, fn);
        router.off(HookName.REQUEST, fn);

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('Hello, World!');

        expect(fnJest).not.toHaveBeenCalled();
    });

    it('should handle error with error handler', async () => {
        const router = new Router();

        router.use(coreHandler(() => {
            throw new Error('handler failed!');
        }));

        router.use(errorHandler((error) => `Error: ${error.message}`));

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('Error: handler failed!');
    });

    it('should remove single hook by unsubscribe', async () => {
        const router = new Router();
        router.use(coreHandler(() => 'Hello, World!'));

        const fnJest = vi.fn();
        const fn: HookDefaultListener = () => {
            fnJest();
        };

        const unsubscribe = router.on(HookName.REQUEST, fn);
        unsubscribe();

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('Hello, World!');

        expect(fnJest).not.toHaveBeenCalled();
    });

    it('should trigger handler error hook', async () => {
        const router = new Router();

        const onErrorFn = vi.fn();

        router.use(coreHandler({
            fn: () => {
                throw new Error('Hello, World!');
            },
            onError() {
                onErrorFn();
            },
        }));

        router.use(errorHandler((error) => `Error: ${error.message}`));

        const res = await router.fetch(createTestRequest('/'));

        expect(res.status).toEqual(200);
        expect(await res.text()).toEqual('Error: Hello, World!');
        expect(onErrorFn).toHaveBeenCalled();
    });

    it('should trigger handler hooks', async () => {
        const router = new Router();

        const onBefore = vi.fn();
        const onAfter = vi.fn();

        router.use(coreHandler({
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
});
