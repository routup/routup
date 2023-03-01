/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    setRequestCookieFn,
    useRequestCookie,
    useRequestCookies,
} from '@routup/core';
import { parseRequestCookies } from './utils';

export {
    useRequestCookie,
    useRequestCookies,
};

setRequestCookieFn(parseRequestCookies);
