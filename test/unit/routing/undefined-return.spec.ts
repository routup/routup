import { describe, expect, it } from 'vitest';
import {
    App,
    defineCoreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('routing/undefined-return', () => {
    it('forwards downstream response when handler calls event.next() without returning it', async () => {
        const router = new App();

        router.use(defineCoreHandler(async (event) => {
            event.response.headers.set('x-trace', 'mw');
            await event.next();
            // intentional: handler returns undefined but called next()
        }));

        router.get(defineCoreHandler(() => 'inner'));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('inner');
        expect(response.headers.get('x-trace')).toBe('mw');
    });

    it('treats explicit null as an empty response (does not hang)', async () => {
        const router = new App({ options: { timeout: 100 } });

        router.get(defineCoreHandler((event) => {
            event.response.status = 204;
            return null;
        }));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toBe(204);
        expect(await response.text()).toBe('');
    });

    it('hangs until global timeout when handler returns undefined and does not call next()', async () => {
        const router = new App({ options: { timeout: 50 } });

        router.get(defineCoreHandler((event) => {
            event.response.headers.set('x-touched', '1');
            // intentional: no return, no event.next()
        }));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toBe(408);
    });

    it('hangs until per-handler timeout when handler returns undefined and does not call next()', async () => {
        const router = new App({ options: { handlerTimeout: 50 } });

        router.get(defineCoreHandler(() => {
            // intentional: no return, no event.next()
        }));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toBe(408);
    });

    it('resumes when event.next() is called asynchronously after handler returns undefined', async () => {
        const router = new App({ options: { timeout: 500 } });

        router.use(defineCoreHandler((event) => {
            setTimeout(() => {
                void event.next();
            }, 20);
            // intentional: returns undefined; next() is called later
        }));

        router.get(defineCoreHandler(() => 'late'));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('late');
    });

    it('aborts event.signal when undefined-return hangs and timeout fires', async () => {
        const router = new App({ options: { timeout: 50 } });
        let aborted = false;

        router.get(defineCoreHandler((event) => {
            event.signal.addEventListener('abort', () => {
                aborted = true;
            });
            // intentional: no return, no event.next()
        }));

        await router.fetch(createTestRequest('/'));

        expect(aborted).toBe(true);
    });
});
