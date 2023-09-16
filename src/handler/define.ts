import type { ErrorHandler, Handler } from './types';

export function defineHandler(input: Handler) : Handler {
    return input;
}

export function defineErrorHandler(input: ErrorHandler) : ErrorHandler {
    return input;
}
