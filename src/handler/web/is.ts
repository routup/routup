/*
 * Copyright (c) 2026.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { isObject } from '../../utils/index.ts';
import type { WebHandler, WebHandlerProvider } from './types.ts';

export function isWebHandlerProvider(input: unknown): input is WebHandlerProvider {
    return isObject(input) &&
        typeof input.fetch === 'function';
}

export function isWebHandler(input: unknown): input is WebHandler {
    return typeof input === 'function';
}
