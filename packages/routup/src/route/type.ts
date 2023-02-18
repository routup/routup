/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { ParseOptions, TokensToRegexpOptions } from 'path-to-regexp';
import type { Path } from '../type';

export type RouteOptions = {
    path: Path,

    pathMatcher: TokensToRegexpOptions & ParseOptions
};
