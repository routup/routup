import type { Input } from '@ebec/http';
import { isError } from './is';
import { RoutupError } from './module';

/**
 * Create an error instance from an options input or
 * wrap an existing error.
 * The wrapped error is accessible via the cause property
 *
 * @param input
 */
export function createError(input: Input) : RoutupError {
    if (isError(input)) {
        return input;
    }

    if (typeof input === 'string') {
        return new RoutupError(input);
    }

    return new RoutupError({ cause: input }, input);
}
