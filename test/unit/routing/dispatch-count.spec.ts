import { describe, expect, it } from 'vitest';
import {
    App,
    defineCoreHandler,
    defineErrorHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

/**
 * Regression coverage for #946: when no handler produced a response (an
 * unmatched route), the match walk re-entered every next()-calling
 * middleware once per remaining match — 2^k dispatches for the handler at
 * match index k. A middleware chain must dispatch each handler exactly once
 * per request, matched or not.
 */
describe('routing/dispatch-count', () => {
    const build = (size: number) => {
        const app = new App();
        const counts: number[] = [];

        for (let i = 0; i < size; i++) {
            const index = i;
            counts[index] = 0;
            app.use(defineCoreHandler((event) => {
                counts[index] = (counts[index] ?? 0) + 1;

                return event.next();
            }));
        }

        app.get('/hit', defineCoreHandler(() => 'ok'));

        return { app, counts };
    };

    it('should dispatch each middleware once on a matched route', async () => {
        const { app, counts } = build(10);

        await app.fetch(createTestRequest('/hit'));

        expect(counts).toEqual(new Array(10).fill(1));
    });

    it('should dispatch each middleware once on an unmatched route', async () => {
        const { app, counts } = build(10);

        await app.fetch(createTestRequest('/miss'));

        expect(counts).toEqual(new Array(10).fill(1));
    });

    it('should still reach a later error handler when a middleware throws after next()', async () => {
        const app = new App();

        app.use(defineCoreHandler(async (event) => {
            await event.next();

            throw new Error('post-next failure');
        }));

        app.use(defineCoreHandler((event) => event.next()));

        app.use(defineErrorHandler((error) => error.message));

        const response = await app.fetch(createTestRequest('/anything'));

        expect(await response.text()).toEqual('post-next failure');
    });

    it('should dispatch downstream once when a middleware calls next() twice (facade dedupe)', async () => {
        const app = new App();
        let downstreamDispatched = 0;

        app.use(defineCoreHandler(async (event) => {
            await event.next();

            return event.next();
        }));

        app.use(defineCoreHandler((event) => {
            downstreamDispatched++;

            return event.next();
        }));

        await app.fetch(createTestRequest('/miss'));

        expect(downstreamDispatched).toEqual(1);
    });

    it('should dispatch a downstream error handler once per next(error)', async () => {
        const app = new App();
        let errorDispatched = 0;

        app.use(defineCoreHandler((event) => event.next(new Error('boom'))));

        app.use(defineErrorHandler((error, event) => {
            errorDispatched++;

            // pass the error along — no response, the walk used to re-enter
            return event.next(error);
        }));

        await app.fetch(createTestRequest('/anything'));

        expect(errorDispatched).toEqual(1);
    });

    it('should keep OPTIONS Allow synthesis intact (the suffix walk records methodsAllowed before the break)', async () => {
        const app = new App();
        let middlewareDispatched = 0;

        app.use(defineCoreHandler((event) => {
            middlewareDispatched++;

            return event.next();
        }));

        app.get('/resource', defineCoreHandler(() => 'get'));
        app.post('/resource', defineCoreHandler(() => 'post'));

        const response = await app.fetch(createTestRequest('/resource', { method: 'OPTIONS' }));

        const allow = (response.headers.get('allow') ?? '').split(',').sort();
        expect(allow).toEqual(['GET', 'HEAD', 'POST']);
        expect(middlewareDispatched).toEqual(1);
    });

    it('should NOT revisit an error handler registered before the failure point (forward-only error flow)', async () => {
        // pre-#946 the exponential re-walk accidentally re-entered EARLIER
        // error handlers (multiple times) after a later middleware threw.
        // Error flow is forward-only now: only handlers after the failure
        // point see the error; without one, the error surfaces as the
        // fallback error response.
        const app = new App();
        let earlyErrorDispatched = 0;

        app.use(defineCoreHandler((event) => event.next()));

        app.use(defineErrorHandler(() => {
            earlyErrorDispatched++;

            return 'early-handler';
        }));

        app.use(defineCoreHandler(async (event) => {
            await event.next();

            throw new Error('post-next failure');
        }));

        const response = await app.fetch(createTestRequest('/anything'));

        expect(earlyErrorDispatched).toEqual(0);
        expect(response.status).toBeGreaterThanOrEqual(500);
    });
});
