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

    const error = new RoutupError({
        expose: false,
        cause,
    });

    if (typeof input.message === 'string') {
        error.message = input.message;
    }

    return error;
}
