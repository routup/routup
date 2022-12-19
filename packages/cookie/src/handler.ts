/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    Handler,
    HeaderName,
    hasRequestCookies,
    setRequestCookies,
} from '@routup/core';
import {
    parse,
} from 'cookie';

import { ParseOptions } from './type';

export function createRequestHandler(options?: ParseOptions) : Handler {
    return (req, res, next) => {
        if (hasRequestCookies(req)) {
            next();
            return;
        }

        const cookies = parse(req.headers[HeaderName.COOKIE] || '', options || {});

        setRequestCookies(req, cookies);

        next();
    };
}
