import { describe, expect, it } from 'vitest';
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
        const error = createError({
            status: 510,
            message: 'foo',
        });
        expect(error.status).toEqual(510);
        expect(error.message).toEqual('foo');
    });

    it('should create error for client error', () => {
        const notFoundError = new NotFoundError();
        const error = createError(notFoundError);

        expect(error).toBeDefined();
        expect(error.status).toEqual(notFoundError.status);
        expect(error.message).toEqual(notFoundError.message);
    });

    it('should create error for server error', () => {
        const internalServerError = new InternalServerError();
        const error = createError(internalServerError);

        expect(error).toBeDefined();
        expect(error.status).toEqual(internalServerError.status);
        expect(error.message).toEqual(internalServerError.message);
    });
});
