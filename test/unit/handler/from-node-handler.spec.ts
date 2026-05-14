import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler } from '../../../src';
import { fromNodeHandler, fromNodeMiddleware } from '../../../src/handler/adapters/node';
import { HandlerType } from '../../../src/handler/constants';
import { createTestRequest } from '../../helpers';

function createFakeNodeRuntime() {
    const res = {
        writableEnded: false,
        destroyed: false,
        once() { return res; },
        removeListener() { return res; },
    };

    return {
        req: {},
        res,
    };
}

function attachNodeRuntime(request: ReturnType<typeof createTestRequest>) {
    (request as any).runtime = { node: createFakeNodeRuntime() };
    return request;
}

describe('src/handler/helpers/from-node-handler', () => {
    it('should throw if argument is not a function', () => {
        expect(() => fromNodeHandler('not a function' as any)).toThrow('expects a function');
        expect(() => fromNodeMiddleware('not a function' as any)).toThrow('expects a function');
    });

    it('should create a Handler from node handler', () => {
        const handler = fromNodeHandler((_req, _res) => {});
        expect(handler.type).toBe(HandlerType.CORE);
    });

    it('should create a Handler from node middleware', () => {
        const handler = fromNodeMiddleware((_req, _res, next) => { next(); });
        expect(handler.type).toBe(HandlerType.CORE);
    });

    // Regression: https://github.com/routup/routup/issues/881
    it('should advance the pipeline when node middleware calls next() without ending the response', async () => {
        const router = new App({ timeout: 1000 });

        let middlewareCalled = false;
        router.use(fromNodeMiddleware((_req, _res, next) => {
            middlewareCalled = true;
            next();
        }));
        router.get('/hello', defineCoreHandler(() => ({ greeting: 'hi' })));

        const response = await router.fetch(attachNodeRuntime(createTestRequest('/hello')));

        expect(middlewareCalled).toBe(true);
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ greeting: 'hi' });
    });

    it('should propagate errors from node middleware next(err)', async () => {
        const router = new App({ timeout: 1000 });

        router.use(fromNodeMiddleware((_req, _res, next) => {
            next(new Error('middleware boom'));
        }));
        router.get('/hello', defineCoreHandler(() => 'unreachable'));

        const response = await router.fetch(attachNodeRuntime(createTestRequest('/hello')));

        expect(response.status).toBeGreaterThanOrEqual(500);
    });
});
