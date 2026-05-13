import { describe, expect, it } from 'vitest';
import {
    Router,
    RoutupError,
    defineCoreHandler,
    defineErrorHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('error context preservation', () => {
    it('should use createError instead of raw cast in hook trigger', async () => {
        const router = new Router();

        router.on('start', () => {
            throw new Error('plain error in hook');
        });

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(500);
        expect(await response.text()).toContain('plain error in hook');
    });

    it('should preserve original error when error handler throws', async () => {
        const router = new Router();
        const capturedErrors: RoutupError[] = [];

        router.use(defineCoreHandler(() => {
            throw new RoutupError({ status: 400, message: 'Bad Request' });
        }));

        router.on('error', () => {
            throw new Error('error in error hook');
        });

        router.on('end', (event) => {
            if (event.error) {
                capturedErrors.push(event.error);
            }
        });

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(400);

        // The original error is preserved — not overwritten by the hook error
        expect(capturedErrors.length).toBeGreaterThan(0);
        expect(capturedErrors[0]!.status).toEqual(400);
        expect(capturedErrors[0]!.message).toEqual('Bad Request');
    });

    it('should allow error handler to transform the error', async () => {
        const router = new Router();

        router.use(defineCoreHandler(() => {
            throw new RoutupError({ status: 422, message: 'Unprocessable' });
        }));

        router.use(defineErrorHandler(() => {
            throw new RoutupError({ status: 503, message: 'Service Unavailable' });
        }));

        const response = await router.fetch(createTestRequest('/'));

        // Error handler's error replaces the original
        expect(response.status).toEqual(503);
    });

    it('should set error normally when no previous error exists', async () => {
        const router = new Router();

        router.use(defineCoreHandler(() => {
            throw new RoutupError({ status: 404, message: 'Not Found' });
        }));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(404);
        const body = await response.json();
        expect(body.message).toEqual('Not Found');
    });
});
