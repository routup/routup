import { describe, expect, it } from 'vitest';
import {
    App,
    AppError,
    defineCoreHandler,
    defineErrorHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('error context preservation', () => {
    it('should allow error handler to transform the error', async () => {
        const router = new App();

        router.use(defineCoreHandler(() => {
            throw new AppError({ status: 422, message: 'Unprocessable' });
        }));

        router.use(defineErrorHandler(() => {
            throw new AppError({ status: 503, message: 'Service Unavailable' });
        }));

        const response = await router.fetch(createTestRequest('/'));

        // Error handler's error replaces the original
        expect(response.status).toEqual(503);
    });

    it('should set error normally when no previous error exists', async () => {
        const router = new App();

        router.use(defineCoreHandler(() => {
            throw new AppError({ status: 404, message: 'Not Found' });
        }));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(404);
        const body = await response.json();
        expect(body.message).toEqual('Not Found');
    });
});
