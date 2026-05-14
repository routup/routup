import { PathMatcher } from '../path/index.ts';
import type { IPathMatcher } from '../path/index.ts';
import { AppStackEntryType } from '../app/constants.ts';
import type { StackEntry } from '../app/types.ts';

/**
 * Build a path-to-regexp-backed `PathMatcher` for the entry's mount
 * path, applying the `end:` semantics every resolver should agree on:
 *
 * - HANDLER entries with a bound method (verb shortcut, or pre-built
 *   `Handler` instance whose own `.method` is set) → exact match
 * - HANDLER entries without a method (middleware) → prefix match
 * - ROUTER entries → prefix match
 *
 * Returns `undefined` when the entry has no mount path — middleware
 * registered without a path matches every request.
 *
 * Resolvers are free to ignore this helper and build their own match
 * mechanism (radix tree, single aggregated regex, etc.) — it's
 * provided as a convenience for resolvers that want path-to-regexp
 * semantics with minimal boilerplate.
 */
export function buildEntryPathMatcher(entry: StackEntry): IPathMatcher | undefined {
    if (typeof entry.path === 'undefined') {
        return undefined;
    }

    const end = entry.type === AppStackEntryType.HANDLER && (
        typeof entry.method !== 'undefined' ||
        typeof entry.data.method !== 'undefined'
    );

    // For prefix matchers a lone '/' contributes nothing useful (it
    // matches every URL), so skip building it. Exact matchers must
    // honor '/' — `router.get('/', …)` matches the root only.
    if (!end && entry.path === '/') {
        return undefined;
    }

    return new PathMatcher(entry.path, { end });
}
