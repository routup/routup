import { describe, expect, it } from 'vitest';
import { fromNodeHandler, fromNodeMiddleware } from '../../../src/handler/helpers';
import { HandlerType } from '../../../src/handler/constants';

describe('src/handler/helpers/from-node-handler', () => {
    it('should throw if argument is not a function', () => {
        expect(() => fromNodeHandler('not a function' as any)).toThrow('expects a function');
        expect(() => fromNodeMiddleware('not a function' as any)).toThrow('expects a function');
    });

    it('should create a Handler from node handler', () => {
        const handler = fromNodeHandler((_req, _res) => {});
        expect(handler.type).toBe(HandlerType.CORE);
    });

    it('should create a Handler from node middleware', () => {
        const handler = fromNodeMiddleware((_req, _res, next) => { next(); });
        expect(handler.type).toBe(HandlerType.CORE);
    });
});
