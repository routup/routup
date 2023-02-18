/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type {
    Request,
} from '@routup/core';
import { parse } from 'qs';

import type { ParseOptions } from './type';

export function parseRequestQuery(req: Request, options?: ParseOptions) {
    /* istanbul ignore if  */
    if (typeof req.url === 'undefined') {
        return {};
    }

    const url = new URL(req.url, 'http://localhost/');

    let { search } = url;
    if (search.substring(0, 1) === '?') {
        search = search.substring(1);
    }

    return parse(search, options);
}
