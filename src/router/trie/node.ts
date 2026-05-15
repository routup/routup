import type { ObjectLiteral } from '../../types.ts';
import type { MethodBuckets, TrieNode } from './types.ts';

export function createMethodBuckets<T extends ObjectLiteral = ObjectLiteral>(): MethodBuckets<T> {
    return Object.create(null) as MethodBuckets<T>;
}

export function createTrieNode<T extends ObjectLiteral = ObjectLiteral>(): TrieNode<T> {
    return {
        staticChildren: new Map(),
        splatRoutes: createMethodBuckets<T>(),
        exactRoutes: createMethodBuckets<T>(),
        prefixRoutes: [],
    };
}
