import { isObject } from '../../../utils/index.ts';
import type { WebHandler, WebHandlerProvider } from './types.ts';

export function isWebHandlerProvider(input: unknown): input is WebHandlerProvider {
    return isObject(input) &&
        typeof input.fetch === 'function';
}

export function isWebHandler(input: unknown): input is WebHandler {
    return typeof input === 'function';
}
