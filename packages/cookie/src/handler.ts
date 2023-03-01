/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Handler } from '@routup/core';
import {
    hasRequestCookies,
    setRequestCookies,
} from '@routup/core';

import type { ParseOptions } from './type';
import { parseRequestCookies } from './utils';

export function createRequestHandler(options?: ParseOptions) : Handler {
    return (req, res, next) => {
        if (hasRequestCookies(req)) {
            next();
            return;
        }

        setRequestCookies(req, parseRequestCookies(req, options));

        next();
    };
}
