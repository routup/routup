import type { CoreHandler } from './types';

export function isCoreHandler(input: unknown) : input is CoreHandler {
    return typeof input === 'function' &&
        input.length <= 3;
}
