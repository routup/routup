import { isInstance, isObject } from '../utils';
import { HandlerSymbol } from './constants';
import type { Handler } from './module';
import type { HandlerConfig } from './types';

export function isHandlerConfig(input: unknown) : input is HandlerConfig {
    return isObject(input) &&
        typeof input.fn === 'function' &&
        typeof input.type === 'string';
}

export function isHandler(input: unknown): input is Handler {
    return isInstance(input, HandlerSymbol);
}
