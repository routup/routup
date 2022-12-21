/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import path from 'path';
import { HandlerOptions, HandlerOptionsInput } from '../type';

export function buildHandlerOptions(input: HandlerOptionsInput) : HandlerOptions {
    const ignorePatterns : RegExp[] = [];

    if (typeof input.ignorePatterns !== 'undefined') {
        ignorePatterns.push(/[/]([A-Za-z\s\d~$._-]+\.\w+)+$/);

        if (input.dotFiles) {
            ignorePatterns.push(/\/\.\w/);
        } else {
            ignorePatterns.push(/\/\.well-known/);
        }

        if (Array.isArray(input.ignorePatterns)) {
            for (let i = 0; i < input.ignorePatterns.length; i++) {
                ignorePatterns.push(new RegExp(input.ignorePatterns[i], 'i'));
            }
        }
    }

    let fallbackPath = '/';
    if (typeof input.spa === 'string') {
        const idx = input.spa.lastIndexOf('.');
        fallbackPath += ~idx ? input.spa.substring(0, idx) : input.spa;
    }

    let directoryPath : string;
    if (input.directoryPath) {
        if (path.isAbsolute(input.directoryPath)) {
            directoryPath = input.directoryPath;
        } else {
            directoryPath = path.resolve(input.directoryPath);
        }
    } else {
        directoryPath = path.resolve('.');
    }

    let cacheMaxAge : number | false;

    if (typeof input.cacheMaxAge === 'boolean') {
        if (input.cacheMaxAge) {
            cacheMaxAge = false;
        } else {
            cacheMaxAge = 0;
        }
    } else {
        cacheMaxAge = input.cacheMaxAge || 0;
    }

    return {
        directoryPath,
        fallbackPath,
        scan: input.scan ?? true,
        cacheMaxAge,
        fallthrough: input.fallthrough ?? true,
        cacheImmutable: input.cacheImmutable ?? false,
        spa: input.spa ?? false,
        ignorePatterns,
        extensions: input.extensions ?? ['html', 'htm'],
        dotFiles: input.dotFiles ?? false,
    };
}
