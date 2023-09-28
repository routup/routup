import { isPath } from '../path';
import { isObject } from '../utils';
import type {
    PluginInstallContext,
} from './types';

export function isPluginInstallContext(input: unknown): input is PluginInstallContext {
    if (!isObject(input) || !isObject(input.options)) {
        return false;
    }

    if (
        typeof input.name !== 'undefined' &&
        typeof input.name !== 'string'
    ) {
        return false;
    }

    return typeof input.path === 'undefined' ||
        isPath(input.path);
}
