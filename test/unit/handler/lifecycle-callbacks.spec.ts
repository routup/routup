import { describe, expect, it } from 'vitest';
import {
    App,
    AppError,
    defineCoreHandler,
    defineErrorHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

/**
 * Per-handler `onBefore` / `onAfter` / `onError` are plain
 * instrumentation callbacks on `HandlerOptions`. They live entirely
 * in `Handler.dispatch` — no app-level hook surface is implied.
 */
describe('handler lifecycle callbacks', () => {
    it('fires onBefore before fn and onAfter after the response is built', async () => {
        const order: string[] = [];
        const app = new App();

        app.get('/', defineCoreHandler({
            onBefore: () => { order.push('before'); },
            onAfter: (_event, response) => {
                order.push(`after:${response?.status ?? 'none'}`);
            },
            fn: () => {
                order.push('fn');
                return 'ok';
            },
        }));

        const res = await app.fetch(createTestRequest('/'));
        expect(res.status).toBe(200);
        expect(await res.text()).toBe('ok');
        expect(order).toEqual(['before', 'fn', 'after:200']);
    });

    it('awaits an async onBefore before invoking fn', async () => {
        const order: string[] = [];
        const app = new App();

        app.get('/', defineCoreHandler({
            onBefore: async () => {
                await new Promise<void>((resolve) => { setTimeout(resolve, 5); });
                order.push('before-resolved');
            },
            fn: () => {
                order.push('fn');
                return 'ok';
            },
        }));

        await app.fetch(createTestRequest('/'));
        expect(order).toEqual(['before-resolved', 'fn']);
    });

    it('fires onError when fn throws and lets the error propagate', async () => {
        const seen: AppError[] = [];
        const app = new App();

        app.get('/', defineCoreHandler({
            onError: (error) => { seen.push(error); },
            fn: () => { throw new AppError({ status: 422, message: 'nope' }); },
        }));
        app.use(defineErrorHandler((error, event) => {
            event.response.status = error.status;
            return { message: error.message };
        }));

        const res = await app.fetch(createTestRequest('/'));
        expect(res.status).toBe(422);
        expect(seen.length).toBe(1);
        expect(seen[0]!.status).toBe(422);
    });

    it('fires onError when onBefore throws — fn does not run', async () => {
        const order: string[] = [];
        const app = new App();

        app.get('/', defineCoreHandler({
            onBefore: () => {
                order.push('before');
                throw new AppError({ status: 401, message: 'forbidden' });
            },
            onError: (error) => { order.push(`onError:${error.status}`); },
            fn: () => { order.push('fn'); return 'ok'; },
        }));
        app.use(defineErrorHandler((error, event) => {
            event.response.status = error.status;
            return { message: error.message };
        }));

        const res = await app.fetch(createTestRequest('/'));
        expect(res.status).toBe(401);
        expect(order).toEqual(['before', 'onError:401']);
    });

    it('onError re-throwing replaces event.error with the new error', async () => {
        const app = new App();

        app.get('/', defineCoreHandler({
            onError: () => {
                throw new AppError({ status: 503, message: 'replaced' });
            },
            fn: () => { throw new AppError({ status: 422, message: 'original' }); },
        }));
        app.use(defineErrorHandler((error, event) => {
            event.response.status = error.status;
            return { message: error.message };
        }));

        const res = await app.fetch(createTestRequest('/'));
        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.message).toBe('replaced');
    });

    it('does not fire onBefore / onAfter for an ERROR handler with no pending error', async () => {
        const order: string[] = [];
        const app = new App();

        app.use(defineErrorHandler({
            onBefore: () => { order.push('before'); },
            onAfter: () => { order.push('after'); },
            fn: () => 'recovered',
        }));
        app.get('/', defineCoreHandler(() => 'ok'));

        await app.fetch(createTestRequest('/'));
        expect(order).toEqual([]);
    });

    it('fires onBefore / onAfter for an ERROR handler that recovers', async () => {
        const order: string[] = [];
        const app = new App();

        app.use(defineCoreHandler(() => { throw new AppError({ status: 500, message: 'boom' }); }));
        app.use(defineErrorHandler({
            onBefore: () => { order.push('before'); },
            onAfter: (_e, response) => { order.push(`after:${response?.status ?? 'none'}`); },
            fn: () => 'recovered',
        }));

        const res = await app.fetch(createTestRequest('/'));
        expect(res.status).toBe(200);
        expect(await res.text()).toBe('recovered');
        expect(order).toEqual(['before', 'after:200']);
    });
});
