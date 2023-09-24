import { ErrorProxy, createError } from '../../../src';

describe('src/error/create', () => {
    it('should not recreate error', () => {
        const foo = new ErrorProxy('foo');
        const error = createError(foo);
        expect(error).toEqual(foo);
    });

    it('should create error by string', () => {
        const error = createError('bar');
        expect(error.message).toEqual('bar');
    });

    it('should create error by options', () => {
        const error = createError({ statusCode: 510, statusMessage: 'foo' });
        expect(error.statusCode).toEqual(510);
        expect(error.statusMessage).toEqual('foo');
    });
});
