import type { IPathMatcher } from '../../path/index.ts';
import type { StackEntry } from '../../app/types.ts';

export type IndexedEntry = {
    entry: StackEntry;
    index: number;
    matcher: IPathMatcher | undefined;
};

export type Segment = { kind: 'static'; value: string } |
    { kind: 'param' } |
    { kind: 'splat' };

export type TrieNode = {
    staticChildren: Map<string, TrieNode>;
    paramChild?: TrieNode;
    /**
     * Entries whose path ends with a splat at this depth (`/files/*`,
     * `/foo/*name`, …). They match the current node and every deeper
     * request path.
     */
    splatEntries: IndexedEntry[];
    /**
     * Exact-match entries whose path ends at this node — only matched
     * when the request path is fully consumed at this depth.
     */
    exactEntries: IndexedEntry[];
    /**
     * Prefix-match entries (middleware / nested routers) whose path
     * ends at this node — matched whenever this node is reached,
     * regardless of remaining depth.
     */
    prefixEntries: IndexedEntry[];
};

export function createTrieNode(): TrieNode {
    return {
        staticChildren: new Map(),
        splatEntries: [],
        exactEntries: [],
        prefixEntries: [],
    };
}
