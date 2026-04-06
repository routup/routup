import { describe, expect, it } from 'vitest';
import {
    HandlerType,
    MethodName,
    defineCoreHandler,
    defineErrorHandler,
} from '../../../src';

describe('src/handler/define', () => {
    it('should define core handler', () => {
        const handler = defineCoreHandler(async () => Promise.resolve());
        expect(handler.type).toEqual(HandlerType.CORE);
    });

    it('should define core handler with method', () => {
        const handler = defineCoreHandler({
            method: 'GET',
            fn: async () => Promise.resolve(),
        });

        expect(handler.method).toEqual(MethodName.GET);
        expect(handler.type).toEqual(HandlerType.CORE);
    });

    it('should define error handler', () => {
        const handler = defineErrorHandler(async () => Promise.resolve());
        expect(handler.type).toEqual(HandlerType.ERROR);
    });
});
