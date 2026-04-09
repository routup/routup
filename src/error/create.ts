import { isHTTPError } from '@ebec/http';
import type { HTTPErrorInput } from '@ebec/http';
import { isObject } from '../utils/index.ts';
import { isError } from './is.ts';
import { RoutupError } from './module.ts';

function isNativeError(input: unknown): input is Error {
    return isObject(input) &&
        typeof (input as Record<string, unknown>).message === 'string' &&
        typeof (input as Record<string, unknown>).name === 'string';
}

/**
 * Create an internal error object by
 * - an existing RoutupError (returned as-is)
 * - an HTTPError (wrapped into a RoutupError preserving status)
 * - an Error (wrapped preserving message and cause)
 * - an options object (status, statusMessage, etc.)
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
            status: input.status,
            statusMessage: input.statusMessage,
            redirectURL: input.redirectURL,
            cause: input,
        });
    }

    if (isNativeError(input)) {
        return new RoutupError({
            message: input.message,
            cause: input,
        });
    }

    if (!isObject(input)) {
        return new RoutupError();
    }

    const options = { ...input as Record<string, unknown> };
    if (options.cause === undefined) {
        options.cause = input;
    }

    return new RoutupError(options as HTTPErrorInput);
}

