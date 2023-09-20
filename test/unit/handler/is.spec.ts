import {
    defineErrorHandler, defineHandler, isErrorHandler, isHandler,
} from '../../../src';

describe('src/handler/is', () => {
    it('should verify handler', () => {
        let is = isHandler(async () => Promise.resolve());
        expect(is).toBeTruthy();

        is = isHandler(defineHandler(async () => Promise.resolve()));
        expect(is).toBeTruthy();
    });

    it('should not verify handler', () => {
        let is = isHandler(async (_err: any, _req: any, _res: any, _next: any) => Promise.resolve());
        expect(is).toBeFalsy();

        is = isHandler(defineErrorHandler(async () => Promise.resolve()));
        expect(is).toBeFalsy();
    });

    it('should verify error handler', () => {
        let is = isErrorHandler(async (_err: any, _req: any, _res: any, _next: any) => Promise.resolve());
        expect(is).toBeTruthy();

        is = isErrorHandler(defineErrorHandler(async () => Promise.resolve()));
        expect(is).toBeTruthy();
    });

    it('should not verify error handler', () => {
        let is = isErrorHandler(async (_req: any, _res: any, _next: any) => Promise.resolve());
        expect(is).toBeFalsy();

        is = isErrorHandler(defineHandler(async () => Promise.resolve()));
        expect(is).toBeFalsy();
    });
});
