import { isHTTPError } from '@ebec/http';
import type { HTTPErrorInput } from '@ebec/http';
import { isObject } from '../utils';
import { isError } from './is';
import { RoutupError } from './module';

/**
 * Create an internal error object by
 * - an existing RoutupError (returned as-is)
 * - an HTTPError (wrapped into a RoutupError preserving status)
 * - an options object (statusCode, statusMessage, etc.)
 * - a message string
 *
 * @param input
 */
export function createError(input: HTTPErrorInput | unknown) : RoutupError {
    if (isError(input)) {
        return input;
    }

    if (typeof input === 'string') {
        return new RoutupError(input);
    }

    if (isHTTPError(input)) {
        return new RoutupError({
            message: input.message,
            code: input.code,
            statusCode: input.statusCode,
            statusMessage: input.statusMessage,
            redirectURL: input.redirectURL,
            cause: input,
        });
    }

    if (!isObject(input)) {
        return new RoutupError();
    }

    const options = input as Record<string, unknown>;
    if (!options.cause) {
        options.cause = input;
    }

    return new RoutupError(options as HTTPErrorInput);
}
