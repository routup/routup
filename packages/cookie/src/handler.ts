/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    Handler,
    hasRequestCookies,
    setRequestCookies,
} from '@routup/core';

import { ParseOptions } from './type';
import { parseRequestCookie } from './utils';

export function createRequestHandler(options?: ParseOptions) : Handler {
    return (req, res, next) => {
        if (hasRequestCookies(req)) {
            next();
            return;
        }

        setRequestCookies(req, parseRequestCookie(req, options));

        next();
    };
}
