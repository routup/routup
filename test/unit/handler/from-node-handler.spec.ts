import { describe, expect, it } from 'vitest';
import { Router } from '../../../src';
import { fromNodeHandler } from '../../../src/handler/helpers/from-node-handler';
import { createTestRequest } from '../../helpers';

describe('src/handler/helpers/from-node-handler', () => {
    it('should throw if argument is not a function', () => {
        expect(() => fromNodeHandler('not a function' as any)).toThrow('expects a function');
    });

    it('should create a Handler instance', () => {
        const handler = fromNodeHandler((_req, _res) => {});
        expect(handler).toBeDefined();
        expect(handler.type).toBeDefined();
    });
});
