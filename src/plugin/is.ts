import { isObject } from '../utils';
import type {
    Plugin,
} from './types';

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

    if (
        typeof input.install !== 'function' ||
        input.install.length !== 1
    ) {
        return false;
    }

    return typeof input.version === 'undefined' ||
        typeof input.version === 'string';
}
