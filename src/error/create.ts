import type { Input } from '@ebec/http';
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
export function createError(input: Input) : ErrorProxy {
    if (isError(input)) {
        return input;
    }

    if (typeof input === 'string') {
        return new ErrorProxy(input);
    }

    return new ErrorProxy({ cause: input }, input);
}
