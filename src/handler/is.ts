import { isInstance, isObject } from '../utils';
import { HandlerSymbol } from './constants';
import type { Handler } from './module';
import type { HandlerOptions } from './types';

export function isHandlerOptions(input: unknown) : input is HandlerOptions {
    return isObject(input) &&
        typeof input.fn === 'function' &&
        typeof input.type === 'string';
}

export function isHandler(input: unknown): input is Handler {
    return isInstance(input, HandlerSymbol);
}

