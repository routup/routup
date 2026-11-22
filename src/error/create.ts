import { isHTTPError } from '@ebec/http';
import type { HTTPErrorInput } from '@ebec/http';
import { isObject } from '../utils/object.ts';
import { isError } from './is.ts';
import { AppError } from './module.ts';

function isNativeError(input: unknown): input is Error {
    return isObject(input) &&
        typeof (input as Record<string, unknown>).message === 'string' &&
        typeof (input as Record<string, unknown>).name === 'string';
}

/**
 * Create an internal error object by
 * - an existing AppError (returned as-is)
 * - an HTTPError (wrapped into a AppError preserving status)
 * - an Error (wrapped preserving message and cause)
 * - an options object (status, message, etc.)
 * - a message string
 *
 * @param input
 */
export function createError(input: HTTPErrorInput | unknown) : AppError {
    if (isError(input)) {
        return input;
    }

    if (typeof input === 'string') {
        return new AppError(input);
    }

    if (isHTTPError(input)) {
        return new AppError({
            message: input.message,
            code: input.code,
            status: input.status,
            redirectURL: input.redirectURL,
            cause: input,
        });
    }

    if (isNativeError(input)) {
        return new AppError({
            message: input.message,
            cause: input,
        });
    }

    if (!isObject(input)) {
        return new AppError();
    }

    // The options bag is input, not a cause: `cause` is set only when
    // the caller passes one, so error handlers unwrapping `error.cause`
    // reach a wrapped error and never the options object (#1005).
    return new AppError(input as HTTPErrorInput);
}

