import { subtle } from 'uncrypto';
import type { EtagOptions } from './types.ts';

async function sha1(str: string) : Promise<string> {
    const enc = new TextEncoder();
    const hash = await subtle.digest('SHA-1', enc.encode(str));

    return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

/**
 * Generate an ETag.
 */
export async function generateETag(input: string) : Promise<string> {
    if (input.length === 0) {
        // fast-path empty
        return '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
    }

    const hash = await sha1(input);

    return `"${input.length.toString(16)}-${hash.substring(0, 27)}"`;
}

/**
 * Create a simple ETag.
 */
export async function createEtag(
    input: string,
    options: EtagOptions = {},
) : Promise<string> {
    // generate entity tag
    const tag = await generateETag(input);

    return options.weak ?
        `W/${tag}` :
        tag;
}
