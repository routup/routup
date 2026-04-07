import { isObject } from '../utils/index.ts';
import type { Plugin } from './types.ts';

export function isPlugin(input: unknown): input is Plugin {
    if (!isObject(input)) {
        return false;
    }

    if (
        typeof input.name !== 'undefined' &&
        typeof input.name !== 'string'
    ) {
        return false;
    }

    return typeof input.install === 'function' &&
        input.install.length === 1;
}
