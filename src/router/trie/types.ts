import type { IPathMatcher } from '../../path/index.ts';
import type { ObjectLiteral, Route } from '../../types.ts';

export type IndexedRoute<T extends ObjectLiteral = ObjectLiteral> = {
    route: Route<T>;
    index: number;
    matcher: IPathMatcher | undefined;
};

export type Segment = { kind: 'static'; value: string } |
    { kind: 'param' } |
    { kind: 'splat' };

/**
 * Method-keyed bucket of indexed routes. The empty-string key
 * (`''`) holds method-agnostic entries (handlers registered without
 * a method binding). Stored as a prototype-less object so user-
 * controlled method strings can't collide with `Object.prototype`
 * keys (`__proto__`, `hasOwnProperty`, …).
 */
export type MethodBuckets<T extends ObjectLiteral = ObjectLiteral> = Record<
    string,
    IndexedRoute<T>[]
>;

export type TrieNode<T extends ObjectLiteral = ObjectLiteral> = {
    staticChildren: Map<string, TrieNode<T>>;
    paramChild?: TrieNode<T>;
    /**
     * Entries whose path ends with a splat at this depth (`/files/*`,
     * `/foo/*name`, …). They match the current node and every deeper
     * request path. Bucketed by HTTP method (`''` = method-agnostic).
     */
    splatRoutes: MethodBuckets<T>;
    /**
     * Exact-match routes whose path ends at this node — only matched
     * when the request path is fully consumed at this depth.
     * Bucketed by HTTP method (`''` = method-agnostic).
     */
    exactRoutes: MethodBuckets<T>;
    /**
     * Prefix-match routes (middleware / nested apps) whose path ends
     * at this node — matched whenever this node is reached,
     * regardless of remaining depth. Not bucketed: middleware is
     * method-agnostic by design (the inner handler does its own
     * method discrimination).
     */
    prefixRoutes: IndexedRoute<T>[];
};

