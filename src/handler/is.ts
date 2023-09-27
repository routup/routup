import { isObject } from '../utils';
import type { Handler } from './types';

export function isHandler(input: unknown) : input is Handler {
    return isObject(input) &&
        typeof input.fn === 'function' &&
        typeof input.type === 'string';
}
