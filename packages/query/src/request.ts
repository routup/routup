/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    setRequestQueryFn,
    useRequestQuery,
} from 'routup';
import { parseRequestQuery } from './utils';

export {
    useRequestQuery,
};

setRequestQueryFn(parseRequestQuery);
