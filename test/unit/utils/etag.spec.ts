import fs from 'node:fs';
import type { EtagFn } from '../../../src/utils';
import { buildEtagFn, createEtag, generateETag } from '../../../src/utils';

describe('src/utils/etag', () => {
    it('should build etag fn', async () => {
        const defaultFn : EtagFn = () => Promise.resolve(undefined);

        let fn = buildEtagFn(defaultFn);
        expect(fn).toEqual(defaultFn);

        fn = buildEtagFn(false);
        expect(fn).toBeDefined();
        expect(await fn('foo')).toBeUndefined();

        fn = buildEtagFn({ threshold: 10_000 });
        expect(fn).toBeDefined();
        expect(await fn('foo')).toBeUndefined();
    });

    it('should generate etag', async () => {
        const stats = fs.statSync('test/data/dummy.json');
        expect(stats).toBeDefined();

        let etag = await generateETag(stats);
        expect(etag.substring(0, 4)).toEqual('"28-');

        etag = await generateETag('');
        expect(etag).toEqual('"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"');

        etag = await generateETag('foo');
        expect(etag).toEqual('"3-C+7Hteo/D9vJXQ3UfzxbwnXaijM"');
    });

    it('should create etag', async () => {
        const etag = await createEtag('');
        expect(etag).toEqual('"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"');
    });
});
