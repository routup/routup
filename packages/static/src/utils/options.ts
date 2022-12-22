/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import path from 'path';
import { HandlerOptions, HandlerOptionsInput } from '../type';

export function buildHandlerOptions(input: HandlerOptionsInput) : HandlerOptions {
    let fallbackPath = '/';
    if (typeof input.fallback === 'string') {
        const idx = input.fallback.lastIndexOf('.');
        fallbackPath += ~idx ? input.fallback.substring(0, idx) : input.fallback;
    }

    const fallbackIgnores : RegExp[] = [];
    if (typeof input.fallbackIgnores !== 'undefined') {
        // any file with extension
        fallbackIgnores.push(/[/]([A-Za-z\s\d~$._-]+\.\w+)+$/);

        if (input.dotFiles) {
            fallbackIgnores.push(/\/\.\w/);
        } else {
            fallbackIgnores.push(/\/\.well-known/);
        }

        if (Array.isArray(input.fallbackIgnores)) {
            for (let i = 0; i < input.fallbackIgnores.length; i++) {
                fallbackIgnores.push(new RegExp(input.fallbackIgnores[i], 'i'));
            }
        } else {
            fallbackIgnores.push(new RegExp(input.fallbackIgnores, 'i'));
        }
    }

    const ignores : RegExp[] = [];
    if (typeof input.ignores !== 'undefined') {
        if (!input.dotFiles) {
            ignores.push(/\/\.\w/);
        }

        if (Array.isArray(input.ignores)) {
            for (let i = 0; i < input.ignores.length; i++) {
                ignores.push(new RegExp(input.ignores[i], 'i'));
            }
        }
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
        fallback: input.fallback ?? false,
        fallbackIgnores,
        extensions: input.extensions ?? ['html', 'htm'],
        dotFiles: input.dotFiles ?? false,
        ignores,
    };
}
