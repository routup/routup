import { describe, expect, it } from 'vitest';
import { MethodName } from '../../../src/constants';
import {
    addImpliedAllowedMethods,
    getMethodFallback,
    matchesRouteMethod,
    seesEveryMethod,
} from '../../../src/utils';

describe('src/utils/method-rule', () => {
    describe('matchesRouteMethod', () => {
        it('should match a route without a method for every request method', () => {
            expect(matchesRouteMethod(undefined, MethodName.GET)).toBe(true);
            expect(matchesRouteMethod(undefined, MethodName.POST)).toBe(true);
            expect(matchesRouteMethod(undefined, MethodName.OPTIONS)).toBe(true);
        });

        it('should match a method-bound route for its own method', () => {
            expect(matchesRouteMethod(MethodName.POST, MethodName.POST)).toBe(true);
            expect(matchesRouteMethod(MethodName.GET, MethodName.GET)).toBe(true);
        });

        it('should not match a method-bound route for another method', () => {
            expect(matchesRouteMethod(MethodName.POST, MethodName.GET)).toBe(false);
            expect(matchesRouteMethod(MethodName.GET, MethodName.POST)).toBe(false);
            expect(matchesRouteMethod(MethodName.GET, MethodName.OPTIONS)).toBe(false);
        });

        it('should match a GET route for a HEAD request', () => {
            expect(matchesRouteMethod(MethodName.GET, MethodName.HEAD)).toBe(true);
        });

        it('should not match a HEAD route for a GET request', () => {
            expect(matchesRouteMethod(MethodName.HEAD, MethodName.GET)).toBe(false);
        });
    });

    describe('getMethodFallback', () => {
        it('should fall HEAD through to GET', () => {
            expect(getMethodFallback(MethodName.HEAD)).toBe(MethodName.GET);
        });

        it('should have no fallback for other methods', () => {
            expect(getMethodFallback(MethodName.GET)).toBeUndefined();
            expect(getMethodFallback(MethodName.POST)).toBeUndefined();
            expect(getMethodFallback(MethodName.OPTIONS)).toBeUndefined();
            expect(getMethodFallback('constructor')).toBeUndefined();
        });
    });

    describe('seesEveryMethod', () => {
        it('should be true for OPTIONS and for no method', () => {
            expect(seesEveryMethod(MethodName.OPTIONS)).toBe(true);
            expect(seesEveryMethod(undefined)).toBe(true);
        });

        it('should be false for other methods', () => {
            expect(seesEveryMethod(MethodName.GET)).toBe(false);
            expect(seesEveryMethod(MethodName.HEAD)).toBe(false);
        });
    });

    describe('addImpliedAllowedMethods', () => {
        it('should add HEAD when GET is allowed', () => {
            const allowed = new Set<string>([MethodName.GET, MethodName.POST]);

            addImpliedAllowedMethods(allowed);

            expect([...allowed]).toEqual([MethodName.GET, MethodName.POST, MethodName.HEAD]);
        });

        it('should leave the set unchanged when GET is not allowed', () => {
            const allowed = new Set<string>([MethodName.POST]);

            addImpliedAllowedMethods(allowed);

            expect([...allowed]).toEqual([MethodName.POST]);
        });

        it('should not duplicate an explicitly allowed HEAD', () => {
            const allowed = new Set<string>([MethodName.HEAD, MethodName.GET]);

            addImpliedAllowedMethods(allowed);

            expect([...allowed]).toEqual([MethodName.HEAD, MethodName.GET]);
        });
    });
});
