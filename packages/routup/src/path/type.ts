/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { ParseOptions, TokensToRegexpOptions } from 'path-to-regexp';

export type PathMatcherOptions = TokensToRegexpOptions & ParseOptions;

export type PathMatcherExecResult = {
    path: string,
    params: Record<string, any>
};
