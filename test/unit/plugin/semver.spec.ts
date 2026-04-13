import { describe, expect, it } from 'vitest';
import { satisfies } from '../../../src/plugin/semver';

describe('src/plugin/semver', () => {
    describe('exact match', () => {
        it('should match exact version', () => {
            expect(satisfies('1.2.3', '1.2.3')).toBe(true);
        });

        it('should reject different version', () => {
            expect(satisfies('1.2.4', '1.2.3')).toBe(false);
        });
    });

    describe('comparison operators', () => {
        it('should handle >=', () => {
            expect(satisfies('1.2.3', '>=1.2.3')).toBe(true);
            expect(satisfies('2.0.0', '>=1.2.3')).toBe(true);
            expect(satisfies('1.2.2', '>=1.2.3')).toBe(false);
        });

        it('should handle >', () => {
            expect(satisfies('1.2.4', '>1.2.3')).toBe(true);
            expect(satisfies('1.2.3', '>1.2.3')).toBe(false);
        });

        it('should handle <=', () => {
            expect(satisfies('1.2.3', '<=1.2.3')).toBe(true);
            expect(satisfies('1.2.2', '<=1.2.3')).toBe(true);
            expect(satisfies('1.2.4', '<=1.2.3')).toBe(false);
        });

        it('should handle <', () => {
            expect(satisfies('1.2.2', '<1.2.3')).toBe(true);
            expect(satisfies('1.2.3', '<1.2.3')).toBe(false);
        });

        it('should handle =', () => {
            expect(satisfies('1.2.3', '=1.2.3')).toBe(true);
            expect(satisfies('1.2.4', '=1.2.3')).toBe(false);
        });
    });

    describe('caret ranges', () => {
        it('^1.2.3 allows >=1.2.3 <2.0.0', () => {
            expect(satisfies('1.2.3', '^1.2.3')).toBe(true);
            expect(satisfies('1.9.9', '^1.2.3')).toBe(true);
            expect(satisfies('1.2.2', '^1.2.3')).toBe(false);
            expect(satisfies('2.0.0', '^1.2.3')).toBe(false);
        });

        it('^0.2.3 allows >=0.2.3 <0.3.0', () => {
            expect(satisfies('0.2.3', '^0.2.3')).toBe(true);
            expect(satisfies('0.2.9', '^0.2.3')).toBe(true);
            expect(satisfies('0.3.0', '^0.2.3')).toBe(false);
        });

        it('^0.0.3 allows only 0.0.3', () => {
            expect(satisfies('0.0.3', '^0.0.3')).toBe(true);
            expect(satisfies('0.0.4', '^0.0.3')).toBe(false);
        });
    });

    describe('tilde ranges', () => {
        it('~1.2.3 allows >=1.2.3 <1.3.0', () => {
            expect(satisfies('1.2.3', '~1.2.3')).toBe(true);
            expect(satisfies('1.2.9', '~1.2.3')).toBe(true);
            expect(satisfies('1.3.0', '~1.2.3')).toBe(false);
            expect(satisfies('1.2.2', '~1.2.3')).toBe(false);
        });
    });

    describe('multiple constraints (space-separated)', () => {
        it('should satisfy all constraints', () => {
            expect(satisfies('1.5.0', '>=1.0.0 <2.0.0')).toBe(true);
            expect(satisfies('2.0.0', '>=1.0.0 <2.0.0')).toBe(false);
            expect(satisfies('0.9.0', '>=1.0.0 <2.0.0')).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('should reject invalid version', () => {
            expect(satisfies('not-a-version', '>=1.0.0')).toBe(false);
        });

        it('should handle prerelease versions', () => {
            expect(satisfies('1.0.0-beta.1', '>=1.0.0')).toBe(false);
            expect(satisfies('1.0.0-alpha', '<1.0.0')).toBe(true);
        });
    });
});
