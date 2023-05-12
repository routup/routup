/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Options } from 'body-parser';
import { raw } from 'body-parser';
import type { Handler } from 'routup';

export function createRequestRawHandler(options?: Options) : Handler {
    return raw(options);
}
