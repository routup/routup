import { isError } from '../../error/is.ts';
import { PluginErrorCode } from './constants.ts';
import type { PluginError } from './module.ts';

const PLUGIN_ERROR_CODES = new Set<string>(Object.values(PluginErrorCode));

export function isPluginError(input: unknown): input is PluginError {
    if (!isError(input)) {
        return false;
    }

    return PLUGIN_ERROR_CODES.has(input.code);
}
