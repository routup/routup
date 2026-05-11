import { hasInstanceof } from '@ebec/core';
import type { Path } from '../path/index.ts';
import { PathMatcher } from '../path/index.ts';
import { withLeadingSlash, withoutTrailingSlash } from '../utils/index.ts';
import { RouterSymbol } from './constants.ts';
import type { Router } from './module.ts';

export function isRouterInstance(input: unknown): input is Router {
    return hasInstanceof(input, RouterSymbol);
}

/**
 * Build a non-terminal `PathMatcher` for a router mount path.
 *
 * Returns `undefined` when the path is the root (`/`) or omitted entirely —
 * a router mounted at the root has no intrinsic path filter.
 */
export function buildRouterPathMatcher(value?: Path): PathMatcher | undefined {
    if (value === '/' || typeof value === 'undefined') {
        return undefined;
    }

    return new PathMatcher(
        withLeadingSlash(withoutTrailingSlash(`${value}`)),
        { end: false },
    );
}

/**
 * Check if the request accepts JSON responses.
 * Matches application/json and +json suffixes (e.g. application/vnd.api+json).
 * Returns true if no Accept header is present (API-first default).
 */
export function acceptsJson(request: Request): boolean {
    const accept = request.headers.get('accept');
    if (!accept) {
        return true;
    }

    return accept.includes('application/json') ||
        accept.includes('+json') ||
        accept.includes('*/*');
}
