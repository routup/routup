import { Buffer } from 'buffer';
import { subtle } from 'uncrypto';
import { type Stats } from 'node:fs';
import { isObject } from '../object';
import type { EtagOptions } from './type';

/**
 * Determine if object is a Stats object.
 *
 * @param {object} obj
 * @return {boolean}
 * @api private
 */
function isStatsObject(obj: unknown) : obj is Stats {
    // quack quack
    return isObject(obj) &&
        'ctime' in obj && Object.prototype.toString.call(obj.ctime) === '[object Date]' &&
        'mtime' in obj && Object.prototype.toString.call(obj.mtime) === '[object Date]' &&
        'ino' in obj && typeof obj.ino === 'number' &&
        'size' in obj && typeof obj.size === 'number';
}

async function sha1(str: string) : Promise<string> {
    const enc = new TextEncoder();
    const hash = await subtle.digest('SHA-1', enc.encode(str));

    return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

/**
 * Generate an ETag.
 */
export async function generateETag(input: string | Buffer | Stats) : Promise<string> {
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
    const hash = await sha1(entity);

    return `"${entity.length.toString(16)}-${hash.substring(0, 27)}"`;
}

/**
 * Create a simple ETag.
 */
export async function createEtag(
    input: string | Buffer | Stats,
    options?: EtagOptions,
) : Promise<string> {
    options = options || {};

    const weak = typeof options.weak === 'boolean' ?
        options.weak :
        isStatsObject(input);

    // generate entity tag
    const tag = await generateETag(input);

    return weak ?
        `W/${tag}` :
        tag;
}
