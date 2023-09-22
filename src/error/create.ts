import { sanitizeStatusCode, sanitizeStatusMessage } from '@ebec/http';
import { hasOwnProperty } from 'smob';
import { isError } from './check';
import { RoutupError } from './module';

export function createError(input: string | Record<string, any>) : RoutupError {
    if (isError(input)) {
        return input;
    }

    if (typeof input === 'string') {
        return new RoutupError({
            message: input,
            expose: true,
        });
    }

    let cause : unknown;
    if (hasOwnProperty(input, 'cause')) {
        cause = input.cause;
    } else {
        cause = input;
    }

    let code : undefined | string | number;
    if (
        typeof input.code === 'number' ||
        typeof input.code === 'string'
    ) {
        code = input.code;
    }

    let statusCode : number | undefined;
    if (typeof input.statusCode !== 'undefined') {
        statusCode = sanitizeStatusCode(input.statusCode);
    }

    let statusMessage : string | undefined;
    if (typeof input.statusMessage === 'string') {
        statusMessage = sanitizeStatusMessage(input.statusMessage);
    }

    const error = new RoutupError({
        code,
        expose: false,
        cause,
        statusCode,
        statusMessage,
    });

    if (typeof input.stack === 'string') {
        error.stack = input.stack;
    }

    if (typeof input.message === 'string') {
        error.message = input.message;
    }

    return error;
}
