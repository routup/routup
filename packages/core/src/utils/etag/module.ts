/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import crypto from 'node:crypto';
import { Stats } from 'node:fs';
import type { EtagOptions } from './type';

/**
 * Determine if object is a Stats object.
 *
 * @param {object} obj
 * @return {boolean}
 * @api private
 */
function isStatsObject(obj: unknown) : obj is Stats {
    // genuine fs.Stats
    if (
        typeof Stats === 'function' &&
        obj instanceof Stats
    ) {
        return true;
    }

    // quack quack
    return !!obj && typeof obj === 'object' &&
        'ctime' in obj && Object.prototype.toString.call(obj.ctime) === '[object Date]' &&
        'mtime' in obj && Object.prototype.toString.call(obj.mtime) === '[object Date]' &&
        'ino' in obj && typeof obj.ino === 'number' &&
        'size' in obj && typeof obj.size === 'number';
}

/**
 * Generate an ETag.
 */
export function generateETag(input: string | Buffer | Stats) : string {
    if (isStatsObject(input)) {
        const mtime = input.mtime.getTime().toString(16);
        const size = input.size.toString(16);

        return `"${size}-${mtime}"`;
    }

    if (input.length === 0) {
        // fast-path empty
        return '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
    }

    const entity = Buffer.isBuffer(input) ?
        input.toString('utf-8') :
        input;

    // compute hash of entity
    const hash = crypto
        .createHash('sha1')
        .update(entity, 'utf8')
        .digest('base64')
        .substring(0, 27);

    return `"${entity.length.toString(16)}-${hash}"`;
}

/**
 * Create a simple ETag.
 */
export function createEtag(
    input: string | Buffer | Stats,
    options?: EtagOptions,
) : string {
    options = options || {};

    const weak = typeof options.weak === 'boolean' ?
        options.weak :
        isStatsObject(input);

    // generate entity tag
    const tag = generateETag(input);

    return weak ?
        `W/${tag}` :
        tag;
}
