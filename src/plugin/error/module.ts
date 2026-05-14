import type { HTTPErrorInput } from '@ebec/http';
import { AppError } from '../../error/module.ts';
import { PluginErrorCode } from './constants.ts';

export class PluginError extends AppError {
    constructor(input: HTTPErrorInput = {}) {
        const options = typeof input === 'string' ? { message: input } : { ...(input as object) };
        if (!('code' in options) || !(options as Record<string, unknown>).code) {
            (options as Record<string, unknown>).code = PluginErrorCode.PLUGIN;
        }
        super(options as HTTPErrorInput);
        this.name = 'PluginError';
    }
}
