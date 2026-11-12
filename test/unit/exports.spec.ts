import { describe, expect, it } from 'vitest';
import * as routup from '../../src';

describe('src/index (public barrel)', () => {
    it('should not export the dispatcher seam or internal modules', () => {
        const removed = [
            'DispatcherEvent',
            'PipelineState',
            'PipelineStep',
            'walkMatches',
            'Deadline',
            'PluginRegistry',
        ];

        for (const name of removed) {
            expect(routup, name).not.toHaveProperty(name);
        }

        expect('dispatch' in routup.App.prototype).toBe(false);
    });

    it('should still export the kept surface', () => {
        const kept = [
            'App',
            'AppEvent',
            'AppError',
            'Handler',
            'HandlerType',
            'LinearRouter',
            'TrieRouter',
            'SmartRouter',
            'LruCache',
            'PathMatcher',
            'MethodName',
            'HeaderName',
            'createError',
            'isError',
            'defineCoreHandler',
            'defineErrorHandler',
            'fromNodeHandler',
            'fromNodeMiddleware',
            'fromWebHandler',
            'isHandler',
            'matchHandlerMethod',
            'isPlugin',
            'isRequestCacheable',
            'toResponse',
            'sendRedirect',
            'getRequestIP',
        ];

        for (const name of kept) {
            expect(routup, name).toHaveProperty(name);
        }

        expect(typeof routup.App.prototype.fetch).toBe('function');
        expect(typeof routup.Handler.prototype.dispatch).toBe('function');
    });
});
