import { hasOwnProperty } from 'smob';
import { HANDLER_PROPERTY_TYPE_KEY, HandlerType } from './constants';
import type { ContextHandler, ErrorHandler, Handler } from './types';

export function isHandler(input: unknown) : input is Handler {
    if (typeof input === 'function') {
        if (hasOwnProperty(input, HANDLER_PROPERTY_TYPE_KEY)) {
            return input[HANDLER_PROPERTY_TYPE_KEY] === HandlerType.DEFAULT;
        }

        // implicit handler recognition
        return input.length <= 3;
    }

    return false;
}

export function isContextHandler(input: unknown) : input is ContextHandler {
    return typeof input === 'function' &&
        hasOwnProperty(input, HANDLER_PROPERTY_TYPE_KEY) &&
        input[HANDLER_PROPERTY_TYPE_KEY] === HandlerType.DEFAULT_CONTEXT;
}

export function isErrorHandler(input: unknown) : input is ErrorHandler {
    if (typeof input === 'function') {
        if (hasOwnProperty(input, HANDLER_PROPERTY_TYPE_KEY)) {
            return input[HANDLER_PROPERTY_TYPE_KEY] === HandlerType.ERROR;
        }

        // implicit handler recognition
        return input.length === 4;
    }

    return false;
}

export function isErrorContextHandler(input: unknown) : input is ContextHandler {
    return typeof input === 'function' &&
        hasOwnProperty(input, HANDLER_PROPERTY_TYPE_KEY) &&
        input[HANDLER_PROPERTY_TYPE_KEY] === HandlerType.ERROR_CONTEXT;
}
