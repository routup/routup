import type { ErrorHandler } from './types';

export function isErrorHandler(input: unknown) : input is ErrorHandler {
    return typeof input === 'function' &&
        input.length === 4;
}
