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

export type TrieNode<T extends ObjectLiteral = ObjectLiteral> = {
    staticChildren: Map<string, TrieNode<T>>;
    paramChild?: TrieNode<T>;
    /**
     * Entries whose path ends with a splat at this depth (`/files/*`,
     * `/foo/*name`, …). They match the current node and every deeper
     * request path.
     */
    splatRoutes: IndexedRoute<T>[];
    /**
     * Exact-match routes whose path ends at this node — only matched
     * when the request path is fully consumed at this depth.
     */
    exactRoutes: IndexedRoute<T>[];
    /**
     * Prefix-match routes (middleware / nested routers) whose path
     * ends at this node — matched whenever this node is reached,
     * regardless of remaining depth.
     */
    prefixRoutes: IndexedRoute<T>[];
};

