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
