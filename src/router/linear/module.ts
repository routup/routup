import type { IPathMatcher } from '../../path/index.ts';
import type { StackEntry } from '../../app/types.ts';
import type { IRouter, RouterMatch } from '../types.ts';
import { buildEntryPathMatcher } from '../utils.ts';

/**
 * Default router — walks registered entries linearly per request and
 * runs each entry's mount-level matcher (built via `buildEntryPathMatcher`,
 * path-to-regexp-backed). Entries without a mount path (mount-less
 * middleware / nested apps registered via `.use(handler)`) match every
 * request directly — there is no per-entry `matchPath()` fallback.
 *
 * Behaviour-preserving wrapper around the previous in-line stack walk
 * in `executePipelineStepLookup`. The matcher allocations live here
 * (not on the registered entry), so routers using a different matching
 * strategy (radix tree, aggregated regex, …) can ignore this file
 * entirely.
 */
export class LinearRouter implements IRouter {
    protected _entries: StackEntry[] = [];

    protected _matchers: (IPathMatcher | undefined)[] = [];

    add(entry: StackEntry): void {
        this._entries.push(entry);
        this._matchers.push(buildEntryPathMatcher(entry));
    }

    lookup(path: string): readonly RouterMatch[] {
        const matches: RouterMatch[] = [];

        for (let i = 0; i < this._entries.length; i++) {
            const entry = this._entries[i]!;
            const matcher = this._matchers[i];

            if (matcher) {
                const output = matcher.exec(path);
                if (typeof output === 'undefined') {
                    continue;
                }
                matches.push({
                    entry,
                    index: i,
                    params: output.params,
                    matchedPath: output.path,
                });
                continue;
            }

            // No matcher → entry has no mount path (middleware /
            // mount-less router). Matches every request.
            matches.push({
                entry,
                index: i,
                // Prototype-less for symmetry with TrieRouter — avoids
                // `__proto__` / `hasOwnProperty` shadowing if user
                // code does `'foo' in match.params`.
                params: Object.create(null) as Record<string, any>,
            });
        }

        return matches;
    }

    get entries(): readonly StackEntry[] {
        return this._entries;
    }

    clone(): IRouter {
        return new LinearRouter();
    }
}
