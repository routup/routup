/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Handler, hasRequestQuery, setRequestQuery } from '@routup/core';
import qs from 'qs';
import { ParseOptions } from './type';

export function createRequestHandler(options?: ParseOptions) : Handler {
    return (req, res, next) => {
        if (hasRequestQuery(req)) {
            next();
            return;
        }

        /* istanbul ignore if  */
        if (typeof req.url === 'undefined') {
            setRequestQuery(req, {});
            next();
            return;
        }

        const url = new URL(req.url, 'http://localhost/');

        let { search } = url;
        if (search.substring(0, 1) === '?') {
            search = search.substring(1);
        }

        const data = qs.parse(search, options);
        setRequestQuery(req, data);
        next();
    };
}
