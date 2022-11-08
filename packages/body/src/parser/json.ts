/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { OptionsJson, json } from 'body-parser';
import { Handler } from 'routup';

export function createRequestJsonHandler(options?: OptionsJson) : Handler {
    return json(options);
}
