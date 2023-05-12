/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import type { PathMatcherOptions } from '../path';
import type { Path } from '../type';

export type RouterOptions = {
    /**
     * The path the router is mounted on.
     *
     * @type string
     * @default '/'
     */
    path?: Path,

    /**
     * Path matcher options.
     *
     * @default: {end: false, sensitive: true}
     */
    pathMatcher?: PathMatcherOptions

    /**
     * Milliseconds (ms) until the request should be canceled.
     *
     * @type number
     * @default undefined
     */
    timeout?: number,
};
