import { hasInstanceof } from '@ebec/core';
import { isObject } from '../utils/index.ts';
import { HandlerSymbol } from './constants.ts';
import type { Handler } from './module.ts';
import type { HandlerOptions } from './types.ts';

export function isHandlerOptions(input: unknown) : input is HandlerOptions {
    return isObject(input) &&
        typeof input.fn === 'function' &&
        typeof input.type === 'string';
}

export function isHandler(input: unknown): input is Handler {
    return hasInstanceof(input, HandlerSymbol);
}

