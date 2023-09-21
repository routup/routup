import { HANDLER_PROPERTY_TYPE_KEY, HandlerType } from './constants';
import type {
    ContextHandler, ErrorContextHandler, ErrorHandler, Handler,
} from './types';

export function defineHandler(input: Handler) : Handler {
    input[HANDLER_PROPERTY_TYPE_KEY] = HandlerType.DEFAULT;

    return input;
}

export function defineContextHandler(input: ContextHandler) : ContextHandler {
    input[HANDLER_PROPERTY_TYPE_KEY] = HandlerType.DEFAULT_CONTEXT;

    return input;
}

export function defineErrorHandler(input: ErrorHandler) : ErrorHandler {
    input[HANDLER_PROPERTY_TYPE_KEY] = HandlerType.ERROR;

    return input;
}

export function defineErrorContextHandler(input: ErrorContextHandler) : ErrorContextHandler {
    input[HANDLER_PROPERTY_TYPE_KEY] = HandlerType.ERROR_CONTEXT;

    return input;
}
