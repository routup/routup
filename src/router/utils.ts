import { isInstance } from '../utils/index.ts';
import { RouterSymbol } from './constants.ts';
import type { Router } from './module.ts';

export function isRouterInstance(input: unknown): input is Router {
    return isInstance(input, RouterSymbol);
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
