import { describe, expect, it } from 'vitest';
import { decodeParam } from '../../../src/utils';

describe('src/utils/decode-param', () => {
    it('should return a plain value unchanged', () => {
        expect(decodeParam('abc')).toBe('abc');
    });

    it('should decode percent-encoded sequences', () => {
        expect(decodeParam('caf%C3%A9')).toBe('café');
        expect(decodeParam('a%2Fb')).toBe('a/b');
    });

    it('should return a malformed percent sequence raw', () => {
        expect(decodeParam('%E0%A4%A')).toBe('%E0%A4%A');
        expect(decodeParam('%')).toBe('%');
    });

    it('should return an empty string unchanged', () => {
        expect(decodeParam('')).toBe('');
    });

    it('should pass non-string input through unchanged', () => {
        expect(decodeParam(undefined)).toBeUndefined();
        expect(decodeParam(5)).toBe(5);
        expect(decodeParam(null)).toBeNull();
    });
});
