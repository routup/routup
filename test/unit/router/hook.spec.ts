import supertest from 'supertest';
import {
    Router, coreHandler, createNodeDispatcher,
} from '../../../src';
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
});
