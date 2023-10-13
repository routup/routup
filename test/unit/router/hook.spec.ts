import supertest from 'supertest';
import {
    Router, coreHandler, createNodeDispatcher,
} from '../../../src';
import type { HookDefaultListener } from '../../../src/hook';
import { HookName } from '../../../src/hook';

type HookMountOutput = {
    [K in `${HookName}`]: jest.Mock<any, any, any>
};
function mountHooks(router: Router) : HookMountOutput {
    const output : Partial<HookMountOutput> = {};
    const keys = Object.values(HookName);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i] as `${HookName}`;
        const fn = jest.fn();
        router.on(key as any, (...args: any[]) => {
            fn();

            // call next fn
            return args.pop()();
        });

        output[key] = fn;
    }

    return output as HookMountOutput;
}

describe('src/router/hooks', () => {
    it('should trigger non error hooks', async () => {
        const router = new Router();
        router.use(coreHandler(() => 'Hello, World!'));

        const hooks = mountHooks(router);

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello, World!');

        expect(hooks[HookName.ERROR]).not.toHaveBeenCalled();
        expect(hooks[HookName.DISPATCH_START]).toHaveBeenCalled();
        expect(hooks[HookName.DISPATCH_END]).toHaveBeenCalled();
        expect(hooks[HookName.DISPATCH_FAIL]).not.toHaveBeenCalled();
        expect(hooks[HookName.HANDLER_BEFORE]).toHaveBeenCalled();
        expect(hooks[HookName.HANDLER_AFTER]).toHaveBeenCalled();
    });

    it('should trigger error hook', async () => {
        const router = new Router();
        router.use(coreHandler(() => {
            throw new Error('Hello, World!');
        }));

        const hooks = mountHooks(router);

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(500);

        expect(hooks[HookName.ERROR]).toHaveBeenCalled();
        expect(hooks[HookName.DISPATCH_START]).toHaveBeenCalled();
        expect(hooks[HookName.DISPATCH_END]).not.toHaveBeenCalled();
        expect(hooks[HookName.DISPATCH_FAIL]).toHaveBeenCalled();
        expect(hooks[HookName.HANDLER_BEFORE]).toHaveBeenCalled();
        expect(hooks[HookName.HANDLER_AFTER]).not.toHaveBeenCalled();
    });

    it('should remove multiple hooks', async () => {
        const router = new Router();
        router.use(coreHandler(() => 'Hello, World!'));

        const hooks = mountHooks(router);

        const keys = Object.keys(hooks) as (HookName[]);
        for (let i = 0; i < keys.length; i++) {
            router.off(keys[i]);
        }

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello, World!');

        expect(hooks[HookName.ERROR]).not.toHaveBeenCalled();
        expect(hooks[HookName.DISPATCH_START]).not.toHaveBeenCalled();
        expect(hooks[HookName.DISPATCH_END]).not.toHaveBeenCalled();
        expect(hooks[HookName.DISPATCH_FAIL]).not.toHaveBeenCalled();
        expect(hooks[HookName.HANDLER_BEFORE]).not.toHaveBeenCalled();
        expect(hooks[HookName.HANDLER_AFTER]).not.toHaveBeenCalled();
    });

    it('should remove single hook', async () => {
        const router = new Router();
        router.use(coreHandler(() => 'Hello, World!'));

        const fnJest = jest.fn();
        const fn : HookDefaultListener = (_req, _res, next) => {
            fnJest();

            next();
        };

        router.on(HookName.DISPATCH_START, fn);
        router.off(HookName.DISPATCH_START, fn);

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello, World!');

        expect(fnJest).not.toHaveBeenCalled();
    });

    it('should handle default hook error', async () => {
        const router = new Router();
        router.use(coreHandler(() => 'Hello, World!'));

        router.on(HookName.DISPATCH_START, () => { throw new Error('dispatch start failed!'); });
        router.on(HookName.ERROR, (error) => error.message);

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('dispatch start failed!');
    });

    it('should handle match hook error', async () => {
        const router = new Router();
        router.use(coreHandler(() => 'Hello, World!'));

        router.on(HookName.MATCH, () => { throw new Error('match failed!'); });
        router.on(HookName.ERROR, (error) => error.message);

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('match failed!');
    });

    it('should remove single hook by index', async () => {
        const router = new Router();
        router.use(coreHandler(() => 'Hello, World!'));

        const fnJest = jest.fn();
        const fn : HookDefaultListener = (_req, _res, next) => {
            fnJest();

            next();
        };

        const index = router.on(HookName.DISPATCH_START, fn);
        router.off(HookName.DISPATCH_START, index);

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello, World!');

        expect(fnJest).not.toHaveBeenCalled();
    });

    it('should trigger handler error hook', async () => {
        const router = new Router();
        router.use(coreHandler({
            fn: () => {
                throw new Error('Hello, World!');
            },
            onError(error) {
                return `Error: ${error.message}`;
            },
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Error: Hello, World!');
    });

    it('should trigger handler hooks', async () => {
        const router = new Router();

        const onBefore = jest.fn();
        const onAfter = jest.fn();

        router.use(coreHandler({
            fn: () => 'Hello, World!',
            onBefore(_req, _res, next) {
                onBefore();
                next();
            },
            onAfter(_req, _res, next) {
                onAfter();
                next();
            },
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello, World!');

        expect(onBefore).toHaveBeenCalled();
        expect(onAfter).toHaveBeenCalled();
    });
});
