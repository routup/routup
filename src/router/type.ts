import type { Path, PathMatcherOptions } from '../path';

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
