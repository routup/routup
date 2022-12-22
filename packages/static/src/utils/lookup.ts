/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import { hasTrailingSlash } from '@routup/core';
import fs from 'fs';
import path from 'path';
import { FileInfo, HandlerOptions } from '../type';
import { readDirectory } from './directory';
import { isRegexMatch } from './regex';

const files : Record<string, FileInfo> = {};

export function scanFiles(options: HandlerOptions) {
    if (!options.scan) {
        return;
    }

    readDirectory(options.directoryPath, (relativePath, filePath, stats) => {
        if (
            !(/\.well-known[\\+/]/.test(relativePath)) &&
            !options.dotFiles &&
            /(^\.|[\\+|/+]\.)/.test(relativePath)
        ) {
            return;
        }

        if (
            options.ignores.length > 0 &&
            isRegexMatch(relativePath, options.ignores)
        ) {
            return;
        }

        const key = `/${relativePath.normalize().replace(/\\+/g, '/')}`;

        files[key] = {
            filePath,
            stats,
        };
    });
}

function generatePaths(requestPath: string, extensions: string[]) : string[] {
    const items = [];

    for (let i = 0; i < extensions.length; i++) {
        items.push(
            requestPath +
            (extensions[i].startsWith('.') ? extensions[i] : `.${extensions[i]}`),
        );
    }

    return items;
}

const lookupPath = async (
    requestPath: string,
    options: HandlerOptions,
) : Promise<FileInfo | undefined> => {
    const relativeFilePaths : string[] = [];

    if (!hasTrailingSlash(requestPath)) {
        relativeFilePaths.push(requestPath);
    }

    if (options.extensions.length > 0) {
        if (hasTrailingSlash(requestPath)) {
            relativeFilePaths.push(...generatePaths(`${requestPath}index`, options.extensions));
        } else {
            const baseName = path.basename(requestPath);
            if (baseName.indexOf('.') === -1) {
                relativeFilePaths.push(...generatePaths(requestPath, options.extensions));
                relativeFilePaths.push(...generatePaths(`${requestPath}/index`, options.extensions));
            }
        }
    }

    if (options.scan) {
        for (let i = 0; i < relativeFilePaths.length; i++) {
            if (typeof files[relativeFilePaths[i]] !== 'undefined') {
                return files[relativeFilePaths[i]];
            }
        }
    } else {
        let filePath : string;
        for (let i = 0; i < relativeFilePaths.length; i++) {
            filePath = path.join(options.directoryPath, relativeFilePaths[i]);

            try {
                const stats = await fs.promises.stat(filePath);
                if (stats.isFile()) {
                    return {
                        stats,
                        filePath,
                    };
                }
            } catch (e) {
                // do nothing :)
            }
        }
    }

    return undefined;
};

export async function lookup(
    requestPath: string,
    options: HandlerOptions,
) : Promise<FileInfo | undefined> {
    let fileInfo : FileInfo | undefined;

    if (
        options.ignores.length === 0 ||
        !isRegexMatch(requestPath, options.ignores)
    ) {
        fileInfo = await lookupPath(requestPath, options);
    }

    if (
        typeof fileInfo === 'undefined' &&
        !!options.fallback &&
        !isRegexMatch(requestPath, options.fallbackIgnores)
    ) {
        fileInfo = await lookupPath(options.fallbackPath, options);
    }

    return fileInfo;
}
