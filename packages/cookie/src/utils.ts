/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { HeaderName, Request } from '@routup/core';
import { parse } from 'cookie';
import { ParseOptions } from './type';

export function parseRequestCookie(req: Request, options?: ParseOptions) {
    return parse(req.headers[HeaderName.COOKIE] || '', options || {});
}
