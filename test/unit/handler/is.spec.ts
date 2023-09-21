import {
    defineContextHandler, defineErrorContextHandler,
    defineErrorHandler, defineHandler, isContextHandler, isErrorContextHandler, isErrorHandler, isHandler,
} from '../../../src';

describe('src/handler/is', () => {
    it('should recognize handler', () => {
        let is = isHandler(async () => Promise.resolve());
        expect(is).toBeTruthy();

        is = isHandler(defineHandler(async () => Promise.resolve()));
        expect(is).toBeTruthy();
    });

    it('should not recognize handler', () => {
        let is = isHandler(async (_err: any, _req: any, _res: any, _next: any) => Promise.resolve());
        expect(is).toBeFalsy();

        is = isHandler(defineErrorHandler(async () => Promise.resolve()));
        expect(is).toBeFalsy();

        is = isHandler(undefined);
        expect(is).toBeFalsy();
    });

    it('should recognize context handler', () => {
        const is = isContextHandler(defineContextHandler((_ctx) => null));
        expect(is).toBeTruthy();
    });

    it('should not recognize context handler', () => {
        const is = isContextHandler((_ctx: any) => null);
        expect(is).toBeFalsy();
    });

    it('should recognize error handler', () => {
        let is = isErrorHandler(async (_err: any, _req: any, _res: any, _next: any) => Promise.resolve());
        expect(is).toBeTruthy();

        is = isErrorHandler(defineErrorHandler(async () => Promise.resolve()));
        expect(is).toBeTruthy();
    });

    it('should not recognize error handler', () => {
        let is = isErrorHandler(async (_req: any, _res: any, _next: any) => Promise.resolve());
        expect(is).toBeFalsy();

        is = isErrorHandler(defineHandler(async () => Promise.resolve()));
        expect(is).toBeFalsy();

        is = isErrorHandler(undefined);
        expect(is).toBeFalsy();
    });

    it('should recognize error handler', () => {
        const is = isErrorContextHandler(defineErrorContextHandler(async () => Promise.resolve()));
        expect(is).toBeTruthy();
    });

    it('should not recognize error handler', () => {
        const is = isErrorContextHandler(async () => Promise.resolve());
        expect(is).toBeFalsy();
    });
});
