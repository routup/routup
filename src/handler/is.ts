import { hasOwnProperty } from 'smob';
import { HANDLER_TYPE_KEY, HandlerType } from './constants';
import type { ErrorHandler, Handler } from './types';

export function isHandler(input: unknown) : input is Handler {
    if (typeof input === 'function') {
        if (hasOwnProperty(input, HANDLER_TYPE_KEY)) {
            return input[HANDLER_TYPE_KEY] === HandlerType.DEFAULT;
        }

        return input.length <= 3;
    }

    return false;
}

export function isErrorHandler(input: unknown) : input is ErrorHandler {
    if (typeof input === 'function') {
        if (hasOwnProperty(input, HANDLER_TYPE_KEY)) {
            return input[HANDLER_TYPE_KEY] === HandlerType.ERROR;
        }

        return input.length === 4;
    }

    return false;
}
