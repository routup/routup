/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { OptionsUrlencoded, urlencoded } from 'body-parser';
import { Handler } from '@routup/core';

export function createRequestUrlEncodedHandler(options?: OptionsUrlencoded) : Handler {
    return urlencoded(options);
}
