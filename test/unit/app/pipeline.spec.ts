import { describe, expect, it } from 'vitest';
import {
    App,
    Handler,
    HandlerType,
    defineErrorHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

/**
 * A handler whose dispatch fails without recording the failure on the
 * pipeline state.
 */
class ThrowingHandler extends Handler {
    constructor() {
        super({ type: HandlerType.CORE, fn: () => 'unreachable' });
    }

    override async dispatch(): Promise<Response | undefined> {
        throw new Error('dispatch failed');
    }
}

describe('src/app/pipeline (walk)', () => {
    it('should answer with the 500 fallback when a dispatch throws without recording the error', async () => {
        const app = new App();

        app.use(new ThrowingHandler());

        const response = await app.fetch(createTestRequest('/'));

        expect(response.status).toBe(500);
        expect(await response.text()).toContain('dispatch failed');
    });

    it('should hand the error of such a dispatch to a later error handler', async () => {
        const app = new App();

        app.use(new ThrowingHandler());
        app.use(defineErrorHandler((error) => `handled: ${error.message}`));

        const response = await app.fetch(createTestRequest('/'));

        expect(await response.text()).toBe('handled: dispatch failed');
    });
});
