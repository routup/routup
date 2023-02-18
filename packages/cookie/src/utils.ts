/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Request } from '@routup/core';
import { HeaderName } from '@routup/core';
import { parse } from 'cookie-es';
import type { ParseOptions } from './type';

export function parseRequestCookie(req: Request, options?: ParseOptions) {
    return parse(req.headers[HeaderName.COOKIE] || '', options || {});
}
