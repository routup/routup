import { HANDLER_TYPE_KEY, HandlerType } from './constants';
import type { ErrorHandler, Handler } from './types';

export function defineHandler(input: Handler) : Handler {
    input[HANDLER_TYPE_KEY] = HandlerType.DEFAULT;

    return input;
}

export function defineErrorHandler(input: ErrorHandler) : ErrorHandler {
    input[HANDLER_TYPE_KEY] = HandlerType.ERROR;

    return input;
}
