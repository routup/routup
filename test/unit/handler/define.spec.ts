import {
    HANDLER_PROPERTY_TYPE_KEY, HandlerType, defineContextHandler, defineErrorContextHandler,
    defineErrorHandler, defineHandler,
} from '../../../src';

describe('src/handler/define', () => {
    it('should define handler', () => {
        const handler = defineHandler(async () => Promise.resolve());
        expect(handler).toBeDefined();
        expect(handler[HANDLER_PROPERTY_TYPE_KEY]).toEqual(HandlerType.DEFAULT);
    });

    it('should define context handler', () => {
        const handler = defineContextHandler((context) => {
            const method = context.request.method || 'GET';

            return `Incoming request with method ${method}`;
        });

        expect(handler).toBeDefined();
        expect(handler[HANDLER_PROPERTY_TYPE_KEY]).toEqual(HandlerType.DEFAULT_CONTEXT);
    });

    it('should define error handler', () => {
        const handler = defineErrorHandler(async () => Promise.resolve());
        expect(handler).toBeDefined();
        expect(handler[HANDLER_PROPERTY_TYPE_KEY]).toEqual(HandlerType.ERROR);
    });

    it('should define error handler', () => {
        const handler = defineErrorContextHandler((context) => {
            const message = context.error.message || 'An internal server error occurred';

            return {
                message,
            };
        });
        expect(handler).toBeDefined();
        expect(handler[HANDLER_PROPERTY_TYPE_KEY]).toEqual(HandlerType.ERROR_CONTEXT);
    });
});
