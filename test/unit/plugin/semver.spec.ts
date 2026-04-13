import { describe, expect, it } from 'vitest';
import { satisfiesVersion } from '../../../src/plugin/semver';

describe('src/plugin/semver', () => {
    describe('exact match', () => {
        it('should match exact version', () => {
            expect(satisfiesVersion('1.2.3', '1.2.3')).toBe(true);
        });

        it('should reject different version', () => {
            expect(satisfiesVersion('1.2.4', '1.2.3')).toBe(false);
        });
    });

    describe('comparison operators', () => {
        it('should handle >=', () => {
            expect(satisfiesVersion('1.2.3', '>=1.2.3')).toBe(true);
            expect(satisfiesVersion('2.0.0', '>=1.2.3')).toBe(true);
            expect(satisfiesVersion('1.2.2', '>=1.2.3')).toBe(false);
        });

        it('should handle >', () => {
            expect(satisfiesVersion('1.2.4', '>1.2.3')).toBe(true);
            expect(satisfiesVersion('1.2.3', '>1.2.3')).toBe(false);
        });

        it('should handle <=', () => {
            expect(satisfiesVersion('1.2.3', '<=1.2.3')).toBe(true);
            expect(satisfiesVersion('1.2.2', '<=1.2.3')).toBe(true);
            expect(satisfiesVersion('1.2.4', '<=1.2.3')).toBe(false);
        });

        it('should handle <', () => {
            expect(satisfiesVersion('1.2.2', '<1.2.3')).toBe(true);
            expect(satisfiesVersion('1.2.3', '<1.2.3')).toBe(false);
        });

        it('should handle =', () => {
            expect(satisfiesVersion('1.2.3', '=1.2.3')).toBe(true);
            expect(satisfiesVersion('1.2.4', '=1.2.3')).toBe(false);
        });
    });

    describe('caret ranges', () => {
        it('^1.2.3 allows >=1.2.3 <2.0.0', () => {
            expect(satisfiesVersion('1.2.3', '^1.2.3')).toBe(true);
            expect(satisfiesVersion('1.9.9', '^1.2.3')).toBe(true);
            expect(satisfiesVersion('1.2.2', '^1.2.3')).toBe(false);
            expect(satisfiesVersion('2.0.0', '^1.2.3')).toBe(false);
        });

        it('^0.2.3 allows >=0.2.3 <0.3.0', () => {
            expect(satisfiesVersion('0.2.3', '^0.2.3')).toBe(true);
            expect(satisfiesVersion('0.2.9', '^0.2.3')).toBe(true);
            expect(satisfiesVersion('0.3.0', '^0.2.3')).toBe(false);
        });

        it('^0.0.3 allows only 0.0.3', () => {
            expect(satisfiesVersion('0.0.3', '^0.0.3')).toBe(true);
            expect(satisfiesVersion('0.0.4', '^0.0.3')).toBe(false);
        });

        it('^1.2.3-beta.2 rejects prereleases of other tuples', () => {
            expect(satisfiesVersion('1.2.3-beta.2', '^1.2.3-beta.2')).toBe(true);
            expect(satisfiesVersion('1.2.3-beta.3', '^1.2.3-beta.2')).toBe(true);
            expect(satisfiesVersion('1.2.3', '^1.2.3-beta.2')).toBe(true);
            expect(satisfiesVersion('1.3.0', '^1.2.3-beta.2')).toBe(true);
            expect(satisfiesVersion('1.3.0-beta.1', '^1.2.3-beta.2')).toBe(false);
            expect(satisfiesVersion('1.2.4-beta.1', '^1.2.3-beta.2')).toBe(false);
        });
    });

    describe('tilde ranges', () => {
        it('~1.2.3 allows >=1.2.3 <1.3.0', () => {
            expect(satisfiesVersion('1.2.3', '~1.2.3')).toBe(true);
            expect(satisfiesVersion('1.2.9', '~1.2.3')).toBe(true);
            expect(satisfiesVersion('1.3.0', '~1.2.3')).toBe(false);
            expect(satisfiesVersion('1.2.2', '~1.2.3')).toBe(false);
        });

        it('~1.2.3-beta.2 rejects prereleases of other tuples', () => {
            expect(satisfiesVersion('1.2.3-beta.2', '~1.2.3-beta.2')).toBe(true);
            expect(satisfiesVersion('1.2.3-beta.5', '~1.2.3-beta.2')).toBe(true);
            expect(satisfiesVersion('1.2.3', '~1.2.3-beta.2')).toBe(true);
            expect(satisfiesVersion('1.2.4', '~1.2.3-beta.2')).toBe(true);
            expect(satisfiesVersion('1.2.4-beta.1', '~1.2.3-beta.2')).toBe(false);
        });
    });

    describe('multiple constraints (space-separated)', () => {
        it('should satisfy all constraints', () => {
            expect(satisfiesVersion('1.5.0', '>=1.0.0 <2.0.0')).toBe(true);
            expect(satisfiesVersion('2.0.0', '>=1.0.0 <2.0.0')).toBe(false);
            expect(satisfiesVersion('0.9.0', '>=1.0.0 <2.0.0')).toBe(false);
        });
    });

    describe('prerelease comparison', () => {
        it('should compare numeric identifiers numerically', () => {
            expect(satisfiesVersion('1.0.0-beta.10', '>=1.0.0-beta.2')).toBe(true);
            expect(satisfiesVersion('1.0.0-beta.1', '>=1.0.0-beta.2')).toBe(false);
        });

        it('should order numeric before non-numeric', () => {
            expect(satisfiesVersion('1.0.0-1', '<1.0.0-alpha')).toBe(true);
        });

        it('should compare non-numeric identifiers lexically', () => {
            expect(satisfiesVersion('1.0.0-alpha', '<1.0.0-beta')).toBe(true);
        });

        it('should treat no prerelease as higher than prerelease', () => {
            expect(satisfiesVersion('1.0.0', '>=1.0.0-beta.1')).toBe(true);
            expect(satisfiesVersion('1.0.0-beta.1', '>=1.0.0')).toBe(false);
            expect(satisfiesVersion('1.0.0-alpha', '<1.0.0')).toBe(true);
        });

        it('should handle multi-segment prerelease', () => {
            expect(satisfiesVersion('1.0.0-alpha.1', '<1.0.0-alpha.2')).toBe(true);
            expect(satisfiesVersion('1.0.0-alpha.1', '<1.0.0-alpha.1.1')).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should reject invalid version', () => {
            expect(satisfiesVersion('not-a-version', '>=1.0.0')).toBe(false);
        });

        it('should ignore build metadata', () => {
            expect(satisfiesVersion('1.2.3+build.001', '1.2.3')).toBe(true);
            expect(satisfiesVersion('1.2.3+build.001', '>=1.2.0')).toBe(true);
        });
    });
});
