export function createError(input: Error | Record<string, any>) {
    if (input instanceof Error) {
        return input;
    }

    const error = new Error();
    if (typeof input.message === 'string') {
        error.message = input.message;
    }

    return error;
}
