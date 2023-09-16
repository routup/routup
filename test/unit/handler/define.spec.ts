import { defineErrorHandler, defineHandler } from '../../../src';

describe('src/handler/define', () => {
    it('should intellisense define handler fn', () => {
        const handler = defineHandler(async () => Promise.resolve());
        expect(handler).toBeDefined();
    });

    it('should intellisense define error handler fn', () => {
        const handler = defineErrorHandler(async () => Promise.resolve());
        expect(handler).toBeDefined();
    });
});
