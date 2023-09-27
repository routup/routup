import { isObject } from '../utils';
import { isCoreHandler } from './core';
import { isErrorHandler } from './error';
import type { Handler, HandlerConfig } from './types';

export function isHandler(input: unknown) : input is Handler {
    return isCoreHandler(input) || isErrorHandler(input);
}

export function isHandlerConfig(input: unknown) : input is HandlerConfig {
    return isObject(input) &&
        typeof input.fn === 'function' &&
        typeof input.type === 'string';
}
