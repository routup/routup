import { describe, expect, it } from 'vitest';
import {
    LinearRouter,
    PathMatcher,
    TrieRouter,
} from '../../../src';
import type { IRouter } from '../../../src';
import { MethodName } from '../../../src/constants';

/**
 * Pins how route params are decoded on both decoding paths: the
 * path-to-regexp matcher (`PathMatcher.exec`, used by `LinearRouter`
 * and the trie's universal bucket) and the trie's segment walk.
 */
const cases: [label: string, raw: string, decoded: string][] = [
    ['plain', 'abc', 'abc'],
    ['percent-encoded', 'caf%C3%A9', 'café'],
    ['encoded slash', 'a%2Fb', 'a/b'],
    ['malformed percent sequence', '%E0%A4%A', '%E0%A4%A'],
    ['lone percent sign', '%', '%'],
];

const routers: Record<string, () => IRouter> = {
    linear: () => new LinearRouter(),
    trie: () => new TrieRouter(),
};

describe('param decoding', () => {
    describe('PathMatcher.exec', () => {
        it.each(cases)('%s', (_label, raw, decoded) => {
            const matcher = new PathMatcher('/users/:id', { end: true });

            expect(matcher.exec(`/users/${raw}`)?.params).toEqual({ id: decoded });
        });

        it('should omit a param that did not participate in the match', () => {
            const matcher = new PathMatcher('/users{/:id}', { end: true });
            const output = matcher.exec('/users');

            expect(output).toBeDefined();
            expect(Object.keys(output!.params)).toEqual([]);
        });
    });

    describe.each(Object.entries(routers))('%s router', (_name, build) => {
        it.each(cases)('segment param: %s', (_label, raw, decoded) => {
            const router = build();

            router.add({
                path: '/users/:id',
                method: MethodName.GET,
                data: {},
            });

            const [match] = router.lookup(`/users/${raw}`, MethodName.GET);

            expect(match?.params).toEqual({ id: decoded });
        });

        it.each(cases)('splat param: %s', (_label, raw, decoded) => {
            const router = build();

            router.add({
                path: '/files/*rest',
                method: MethodName.GET,
                data: {},
            });

            const [match] = router.lookup(`/files/x/${raw}`, MethodName.GET);

            expect(match?.params).toEqual({ rest: `x/${decoded}` });
        });
    });
});
