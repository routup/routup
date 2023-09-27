import {
    HandlerType,
    coreHandler,
    errorHandler,
} from '../../../src';

describe('src/handler/define', () => {
    it('should define core handler', () => {
        const handler = coreHandler(async () => Promise.resolve());
        expect(handler).toBeDefined();
        expect(handler.type).toEqual(HandlerType.CORE);
    });

    it('should define error handler', () => {
        const handler = errorHandler(async () => Promise.resolve());
        expect(handler).toBeDefined();
        expect(handler.type).toEqual(HandlerType.ERROR);
    });
});
