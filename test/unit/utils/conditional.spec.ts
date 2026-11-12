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

        it('should not split an etag at a comma inside its quotes', () => {
            expect(matchesETagList('"a,b"', '"a,b"')).toBe(true);
            expect(matchesETagList('"x", W/"a,b", "y"', '"a,b"')).toBe(true);
            expect(matchesETagList('"a,b"', '"a"')).toBe(false);
            expect(matchesETagList('"a,b"', 'b"')).toBe(false);
        });

        it('should still compare unquoted entries literally', () => {
            expect(matchesETagList('abc, def', 'def')).toBe(true);
            expect(matchesETagList('abc', 'abd')).toBe(false);
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

        it('should accept the three HTTP-date formats', () => {
            // IMF-fixdate, RFC 850 and asctime (RFC 9110 section 5.6.7), all GMT.
            expect(isNotModifiedSince('Mon, 01 Jan 2024 10:00:00 GMT', lastModified)).toBe(true);
            expect(isNotModifiedSince('Monday, 01-Jan-24 10:00:00 GMT', lastModified)).toBe(true);
            expect(isNotModifiedSince('Mon Jan  1 10:00:00 2024', lastModified)).toBe(true);
            expect(isNotModifiedSince('Mon Jan  1 09:59:59 2024', lastModified)).toBe(false);
        });

        it('should ignore a value that is not an HTTP-date', () => {
            expect(isNotModifiedSince('2099-01-01', lastModified)).toBe(false);
            expect(isNotModifiedSince('2099-01-01T00:00:00.000Z', lastModified)).toBe(false);
            expect(isNotModifiedSince('4102444800000', lastModified)).toBe(false);
            expect(isNotModifiedSince('Fri, 01 Jan 2099 10:00:00 +0100', lastModified)).toBe(false);
            expect(isNotModifiedSince(
                'Fri, 01 Jan 2099 10:00:00 GMT, Fri, 01 Jan 2099 11:00:00 GMT',
                lastModified,
            )).toBe(false);
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

        it('should let an empty but present If-None-Match suppress If-Modified-Since', () => {
            expect(isFresh({
                ifNoneMatch: '',
                ifModifiedSince: lastModified.toUTCString(),
            }, validators)).toBe(false);
        });

        it('should fall back to If-Modified-Since when If-None-Match is null or undefined', () => {
            expect(isFresh({
                ifNoneMatch: null,
                ifModifiedSince: lastModified.toUTCString(),
            }, validators)).toBe(true);

            expect(isFresh({
                ifNoneMatch: undefined,
                ifModifiedSince: lastModified.toUTCString(),
            }, validators)).toBe(true);
        });

        it('should not be fresh without the validator the request asks about', () => {
            expect(isFresh({ ifNoneMatch: etag }, { lastModified })).toBe(false);
            expect(isFresh({ ifModifiedSince: lastModified.toUTCString() }, { etag })).toBe(false);
        });
    });
});
