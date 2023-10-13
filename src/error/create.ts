import type { Input } from '@ebec/http';
import { isObject } from '../utils';
import { isError } from './is';
import { ErrorProxy } from './module';

/**
 * Create an error proxy by
 * - an existing error (accessible via cause property)
 * - options
 * - message
 *
 * @param input
 */
// todo: rename to createDispatcherError
export function createError(input: Input | unknown) : ErrorProxy {
    if (isError(input)) {
        return input;
    }

    if (typeof input === 'string') {
        return new ErrorProxy(input);
    }

    if (!isObject(input)) {
        return new ErrorProxy();
    }

    return new ErrorProxy({ cause: input }, input);
}
