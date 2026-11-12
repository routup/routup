import { describe, expect, it } from 'vitest';
import { buildRoutePathMatcher } from '../../../src';
import type { Route } from '../../../src';
import { MethodName } from '../../../src/constants';
import { matchLinearRoute } from '../../../src/router/walk';

describe('src/router/walk', () => {
    it('should match a route without a matcher with empty prototype-less params and no path', () => {
        const route: Route = { data: {} };
        const match = matchLinearRoute(route, 3, undefined, '/anything');

        expect(match).toBeDefined();
        expect(match!.route).toBe(route);
        expect(match!.index).toBe(3);
        expect(Object.getPrototypeOf(match!.params)).toBeNull();
        expect(Object.keys(match!.params)).toEqual([]);
        expect('path' in match!).toBe(false);
    });

    it('should return the matcher output for a matching route', () => {
        const route: Route = {
            path: '/users/:id',
            method: MethodName.GET,
            data: {},
        };
        const match = matchLinearRoute(route, 0, buildRoutePathMatcher(route), '/users/42');

        expect(match).toBeDefined();
        expect(match!.route).toBe(route);
        expect(match!.index).toBe(0);
        expect(match!.params).toEqual({ id: '42' });
        expect(Object.getPrototypeOf(match!.params)).toBeNull();
        expect(match!.path).toBe('/users/42');
    });

    it('should return the consumed prefix for a prefix route', () => {
        const route: Route = { path: '/api', data: {} };
        const match = matchLinearRoute(route, 1, buildRoutePathMatcher(route), '/api/users');

        expect(match!.path).toBe('/api');
        expect(Object.keys(match!.params)).toEqual([]);
    });

    it('should return undefined when the matcher rejects the path', () => {
        const route: Route = {
            path: '/users/:id',
            method: MethodName.GET,
            data: {},
        };

        expect(matchLinearRoute(route, 0, buildRoutePathMatcher(route), '/posts/1')).toBeUndefined();
    });
});
