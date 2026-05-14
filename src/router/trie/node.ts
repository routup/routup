import type { ObjectLiteral } from '../../types.ts';
import type { TrieNode } from './types.ts';

export function createTrieNode<T extends ObjectLiteral = ObjectLiteral>(): TrieNode<T> {
    return {
        staticChildren: new Map(),
        splatRoutes: [],
        exactRoutes: [],
        prefixRoutes: [],
    };
}
