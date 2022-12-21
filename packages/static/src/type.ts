/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import fs, { Stats } from 'fs';

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
     * Boolean or relative path to main directory.
     *
     * default: false
     */
    spa: string | boolean;
    /**
     * Ignore specific files or directories.
     *
     * default: []
     */
    ignorePatterns: RegExp[];
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
};

export type HandlerOptionsInput = Omit<Partial<HandlerOptions>, 'ignorePatterns' | 'fallbackPath'> & {
    /**
     * Ignore specific files or directories.
     *
     * default: undefined
     */
    ignorePatterns?: Array<string | RegExp> | string | RegExp;
};

export type ReadDirectoryCallback = (relativePath: string, absolutePath: string, stats: fs.Stats) => void;

export type FileInfo = {
    stats: Stats,
    filePath: string
};
