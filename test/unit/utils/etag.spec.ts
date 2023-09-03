import fs from 'node:fs';
import { createEtag, generateETag } from '../../../src';

describe('src/utils/etag', () => {
    it('should generate etag', () => {
        const stats = fs.statSync('test/data/dummy.json');
        expect(stats).toBeDefined();

        let etag = generateETag(stats);
        expect(etag).toEqual('"28-1881175b497"');

        etag = generateETag('');
        expect(etag).toEqual('"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"');

        etag = generateETag('foo');
        expect(etag).toEqual('"3-C+7Hteo/D9vJXQ3UfzxbwnXaijM"');
    });

    it('should create etag', () => {
        const etag = createEtag('');
        expect(etag).toEqual('"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"');
    });
});
