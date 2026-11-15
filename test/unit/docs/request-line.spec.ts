import { describe, expect, it } from 'vitest';
import {
    DEFAULT_REQUEST,
    DEFAULT_RESULT,
    createDemoApp,
    parseRequestLine,
    runRequestLine,
} from '../../../docs/src/.vitepress/components/home/request-line';

describe('docs/request-line', () => {
    describe('parseRequestLine', () => {
        it('should parse a method and a path', () => {
            expect(parseRequestLine('GET /users/42')).toEqual({ method: 'GET', path: '/users/42' });
        });

        it('should default the method to GET', () => {
            expect(parseRequestLine('/users/42')).toEqual({ method: 'GET', path: '/users/42' });
        });

        it('should upper-case the method', () => {
            expect(parseRequestLine('get /users/1')?.method).toBe('GET');
        });

        it('should trim the input', () => {
            expect(parseRequestLine('  POST /users  ')).toEqual({ method: 'POST', path: '/users' });
        });

        it('should parse the default request as a bare GET path', () => {
            expect(parseRequestLine(DEFAULT_REQUEST)).toEqual({ method: 'GET', path: '/users/42' });
        });

        it.each(['', ' '.repeat(3), 'GET users', 'FETCH /x', 'GET /a /b'])('should reject %j', (input) => {
            expect(parseRequestLine(input)).toBeUndefined();
        });
    });

    describe('runRequestLine', () => {
        it('should return the default result for the default request', async () => {
            const result = await runRequestLine(createDemoApp(), { method: 'GET', path: '/users/42' });

            expect(result).toEqual(DEFAULT_RESULT);
        });

        it('should ignore the query string when matching', async () => {
            const result = await runRequestLine(createDemoApp(), { method: 'GET', path: '/users/42?x=1' });

            expect(result.status).toBe(200);
        });

        it('should return 404 for an unknown path', async () => {
            const result = await runRequestLine(createDemoApp(), { method: 'GET', path: '/nope' });

            expect(result.status).toBe(404);
        });

        it('should not match another method', async () => {
            const result = await runRequestLine(createDemoApp(), { method: 'POST', path: '/users/42' });

            expect([404, 405]).toContain(result.status);
            expect(result.body.length).toBeGreaterThan(0);
        });
    });
});
