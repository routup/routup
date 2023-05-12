/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Handler } from 'routup';
import { hasRequestQuery, setRequestQuery } from 'routup';
import type { ParseOptions } from './type';
import { parseRequestQuery } from './utils';

export function createHandler(options?: ParseOptions) : Handler {
    return (req, res, next) => {
        if (hasRequestQuery(req)) {
            next();

            return;
        }

        setRequestQuery(req, parseRequestQuery(req, options));
        next();
    };
}
