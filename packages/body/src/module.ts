/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Options } from 'body-parser';
import { Handler } from 'routup';
import { createRequestJsonParser, createRequestUrlEncodedParser } from './parser';

export {
    useRequestBody,
} from 'routup';

export function createRequestParser(options?: Options) : Handler {
    const jsonParser = createRequestJsonParser(options);
    const urlEncodedParser = createRequestUrlEncodedParser(options);

    return (req, res, next) => {
        jsonParser(req, res, (err) => {
            if (err) {
                next(err);
            } else {
                urlEncodedParser(req, res, next);
            }
        });
    };
}
