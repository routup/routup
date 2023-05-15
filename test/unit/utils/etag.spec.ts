import fs from 'node:fs';
import { createEtag, generateETag } from '../../../src';

describe('src/utils/etag', () => {
    it('should generate etag', () => {
        const stats = fs.statSync('test/data/dummy.json');
        expect(stats).toBeDefined();

        let etag = generateETag(stats);
        expect(etag).toBeDefined();

        etag = generateETag('');
        expect(etag).toEqual('"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"');

        etag = generateETag('foo');
        expect(etag).toBeDefined();
    });

    it('should create etag', () => {
        const etag = createEtag('');
        expect(etag).toEqual('"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"');
    });
});
