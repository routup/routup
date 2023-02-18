/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { OptionsJson } from 'body-parser';
import { json } from 'body-parser';
import type { Handler } from '@routup/core';

export function createRequestJsonHandler(options?: OptionsJson) : Handler {
    return json(options);
}
