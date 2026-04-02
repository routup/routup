import type { Input } from '@ebec/http';
import { isObject } from '../utils';
import { isError } from './is';
import { RoutupError } from './module';

/**
 * Create an internal error object by
 * - an existing error (accessible via cause property)
 * - options
 * - message
 *
 * @param input
 */
export function createError(input: Input | unknown) : RoutupError {
    if (isError(input)) {
        return input;
    }

    if (typeof input === 'string') {
        return new RoutupError(input);
    }

    if (!isObject(input)) {
        return new RoutupError();
    }

    return new RoutupError({ cause: input }, input);
}
