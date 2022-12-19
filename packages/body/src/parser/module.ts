/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Options } from 'body-parser';
import { Handler } from '@routup/core';
import { createRequestJsonHandler } from './json';
import { createRequestUrlEncodedHandler } from './url-encoded';

export function createRequestHandler(options?: Options) : Handler {
    const jsonParser = createRequestJsonHandler(options);
    const urlEncodedParser = createRequestUrlEncodedHandler(options);

    return (req, res, next) => {
        jsonParser(req, res, (err) => {
            /* istanbul ignore next */
            if (err) {
                next(err);
            } else {
                urlEncodedParser(req, res, next);
            }
        });
    };
}
