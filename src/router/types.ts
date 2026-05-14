import type { StackEntry } from '../app/types.ts';

/**
 * A single matched entry returned by `IRouter.lookup`.
 *
 * The dispatch loop consumes these instead of walking the raw stack —
 * `params` are pre-extracted at lookup time so we don't re-run
 * `pathMatcher.exec` later, and `matchedPath` (when set) tells the
 * loop how much of `event.path` to strip when recursing into a child
 * router.
 */
export type RouterMatch = {
    entry: StackEntry;
    /**
     * Registration index in the resolver. Used by the dispatch loop's
     * `setNext` continuation ("resume from index + 1") and by
     * `App.clone()` to re-register entries in their original order.
     */
    index: number;
    /**
     * Path params extracted from the entry's `pathMatcher`. Empty
     * object when the entry has no path or no params.
     */
    params: Record<string, any>;
    /**
     * For entries with a `pathMatcher`: the path substring the matcher
     * consumed. Used by `executePipelineStepChildDispatch` to strip the
     * matched prefix off `event.path` before dispatching into a child
     * router. Undefined for entries without a `pathMatcher`.
     */
    matchedPath?: string;
};

/**
 * Pluggable strategy for storing routes and answering "which entries
 * match this path?". The default `LinearRouter` walks the
 * stored entries linearly and runs each entry's `pathMatcher`.
 * Alternative implementations (radix tree, trie, regex aggregation)
 * can swap in via `AppOptionsInput.resolver` to skip the walk
 * entirely on apps with many routes.
 *
 * Method matching is intentionally kept at the dispatch-loop call site,
 * not here, because method semantics differ between HANDLER and ROUTER
 * stack entries (only HANDLER entries are method-bound).
 */
export interface IRouter {
    /**
     * Register a stack entry. Entries are stored in registration order
     * — the order they were passed to `App.use` / `.get` / `.post` /
     * etc. — and lookup results preserve that order.
     */
    add(entry: StackEntry): void;

    /**
     * Return every entry that matches the given path, in registration
     * order. The dispatch loop iterates this list; nested `setNext`
     * re-entries resume from a later index in the same list.
     */
    lookup(path: string): readonly RouterMatch[];

    /**
     * All registered entries in registration order. `App.clone()`
     * iterates this to re-register entries on the cloned instance via
     * the public registration API.
     */
    readonly entries: readonly StackEntry[];
}
