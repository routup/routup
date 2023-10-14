import {
    HandlerType,
    MethodName,
    coreHandler, errorHandler,
} from '../../../src';

describe('src/handler/define', () => {
    it('should define core handler', () => {
        const handler = coreHandler(async () => Promise.resolve());
        expect(handler.type).toEqual(HandlerType.CORE);
    });

    it('should define core handler with method', () => {
        const handler = coreHandler({
            method: 'GET',
            fn: async () => Promise.resolve(),
        });

        expect(handler.method).toEqual(MethodName.GET);
        expect(handler.type).toEqual(HandlerType.CORE);
    });

    it('should define error handler', () => {
        const handler = errorHandler(async () => Promise.resolve());
        expect(handler.type).toEqual(HandlerType.ERROR);
    });
});
