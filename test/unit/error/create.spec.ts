import { InternalServerError, NotFoundError } from '@ebec/http';
import { RoutupError, createError } from '../../../src';

describe('src/error/create', () => {
    it('should not recreate error', () => {
        const foo = new RoutupError('foo');
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

    it('should create error for client error', () => {
        const notFoundError = new NotFoundError();
        const error = createError(notFoundError);

        expect(error).toBeDefined();
        expect(error.statusCode).toEqual(notFoundError.statusCode);
        expect(error.statusMessage).toEqual(notFoundError.statusMessage);
        expect(error.expose).toBeTruthy();
    });

    it('should create error for server error', () => {
        const internalServerError = new InternalServerError();
        const error = createError(internalServerError);

        expect(error).toBeDefined();
        expect(error.statusCode).toEqual(internalServerError.statusCode);
        expect(error.statusMessage).toEqual(internalServerError.statusMessage);
        expect(error.expose).toBeFalsy();
    });
});
