import { describe, expect, it } from 'vitest';
import {
    isFresh,
    isNotModifiedSince,
    matchesETagList,
} from '../../../src/utils';

describe('src/utils/conditional', () => {
    describe('matchesETagList', () => {
        it('should match an identical strong etag', () => {
            expect(matchesETagList('"abc"', '"abc"')).toBe(true);
        });

        it('should compare weakly in both directions', () => {
            expect(matchesETagList('W/"abc"', '"abc"')).toBe(true);
            expect(matchesETagList('"abc"', 'W/"abc"')).toBe(true);
            expect(matchesETagList('W/"abc"', 'W/"abc"')).toBe(true);
        });

        it('should match an etag inside a comma separated list', () => {
            expect(matchesETagList('"x", W/"abc" ,"y"', '"abc"')).toBe(true);
        });

        it('should match any etag for *', () => {
            expect(matchesETagList('*', '"abc"')).toBe(true);
        });

        it('should not match a different etag', () => {
            expect(matchesETagList('"x", "y"', '"abc"')).toBe(false);
        });

        it('should not match a missing or empty header', () => {
            expect(matchesETagList(null, '"abc"')).toBe(false);
            expect(matchesETagList(undefined, '"abc"')).toBe(false);
            expect(matchesETagList('', '"abc"')).toBe(false);
        });
    });

    describe('isNotModifiedSince', () => {
        const lastModified = new Date('2024-01-01T10:00:00.000Z');

        it('should be true for an equal date', () => {
            expect(isNotModifiedSince(lastModified.toUTCString(), lastModified)).toBe(true);
        });

        it('should be true for a later date', () => {
            expect(isNotModifiedSince('Mon, 01 Jan 2024 11:00:00 GMT', lastModified)).toBe(true);
        });

        it('should be false for an earlier date', () => {
            expect(isNotModifiedSince('Mon, 01 Jan 2024 09:00:00 GMT', lastModified)).toBe(false);
        });

        it('should accept the modification time as a string', () => {
            expect(isNotModifiedSince(lastModified.toUTCString(), lastModified.toUTCString())).toBe(true);
        });

        it('should be false for a missing or invalid header', () => {
            expect(isNotModifiedSince(null, lastModified)).toBe(false);
            expect(isNotModifiedSince('', lastModified)).toBe(false);
            expect(isNotModifiedSince('not a date', lastModified)).toBe(false);
        });

        it('should be false for an invalid modification time', () => {
            expect(isNotModifiedSince(lastModified.toUTCString(), 'not a date')).toBe(false);
        });
    });

    describe('isFresh', () => {
        const etag = 'W/"10-1704103200000"';
        const lastModified = new Date('2024-01-01T10:00:00.000Z');
        const validators = { etag, lastModified };

        it('should not be fresh for an unconditional request', () => {
            expect(isFresh({}, validators)).toBe(false);
        });

        it('should be fresh for a matching If-None-Match', () => {
            expect(isFresh({ ifNoneMatch: '"10-1704103200000"' }, validators)).toBe(true);
        });

        it('should be fresh for a current If-Modified-Since', () => {
            expect(isFresh({ ifModifiedSince: lastModified.toUTCString() }, validators)).toBe(true);
        });

        it('should not be fresh for an outdated If-Modified-Since', () => {
            expect(isFresh({ ifModifiedSince: 'Mon, 01 Jan 2024 09:00:00 GMT' }, validators)).toBe(false);
        });

        it('should ignore If-Modified-Since when If-None-Match is present', () => {
            expect(isFresh({
                ifNoneMatch: '"other"',
                ifModifiedSince: lastModified.toUTCString(),
            }, validators)).toBe(false);

            expect(isFresh({
                ifNoneMatch: etag,
                ifModifiedSince: 'Mon, 01 Jan 2024 09:00:00 GMT',
            }, validators)).toBe(true);
        });

        it('should not be fresh without the validator the request asks about', () => {
            expect(isFresh({ ifNoneMatch: etag }, { lastModified })).toBe(false);
            expect(isFresh({ ifModifiedSince: lastModified.toUTCString() }, { etag })).toBe(false);
        });
    });
});
