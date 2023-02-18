/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Stats } from 'node:fs';
import type fs from 'node:fs';

export type HandlerOptions = {
    /**
     * Path for serving files.
     */
    directoryPath: string,

    /**
     * Fallback path.
     * default: '/'
     */
    fallbackPath: string,
    /**
     * Scan metadata of given files in a directory.
     *
     * default: false
     */
    scan: boolean,
    /**
     * Max age till cache expires.
     *
     * default: 0
     */
    cacheMaxAge: number | false;
    /**
     * Cache Control immutable flag.
     *
     * default: false
     */
    cacheImmutable: boolean;
    /**
     * Forward the request to the next handler,
     * if the file was not found.
     *
     * default: true
     */
    fallthrough: boolean;
    /**
     * Serving single-page-application?
     * Boolean or relative path to main directory, when a
     * path can not be resolved.
     *
     * default: false
     */
    fallback: string | boolean;
    /**
     * Paths/patterns that should not be forwarded to the fallback path.
     *
     * default: []
     */
    fallbackIgnores: RegExp[];
    /**
     * Extensions to append to directory index file.
     *
     * default: ['html', 'htm']
     */
    extensions: string[];
    /**
     * Allow dot files.
     *
     * default: false
     */
    dotFiles: boolean;

    /**
     * Paths/patterns which should be ignored aka not served.
     *
     * default: []
     */
    ignores: RegExp[],
};

export type HandlerOptionsInput = Omit<
Partial<HandlerOptions>,
'fallbackIgnores' | 'fallbackPath' | 'ignores'
> & {
    /**
     * Paths/patterns that should not be forwarded to the fallback path.
     *
     * default: [.well-known]
     */
    fallbackIgnores?: Array<string | RegExp> | string | RegExp;

    /**
     * Paths/patterns which should be ignored aka not served.
     *
     * default: []
     */
    ignores?: Array<string | RegExp> | string | RegExp
};

export type ReadDirectoryCallback = (relativePath: string, absolutePath: string, stats: fs.Stats) => void;

export type FileInfo = {
    stats: Stats,
    filePath: string
};
