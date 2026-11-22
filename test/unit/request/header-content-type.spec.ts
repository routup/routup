import { describe, expect, it } from 'vitest';
import {
    App,
    AppError,
    assertRequestContentType,
    defineCoreHandler,
} from '../../../src';
import { createTestEvent, createTestRequest } from '../../helpers';

function run(contentType: string | undefined, types: string | string[]) {
    const event = createTestEvent('/', {
        method: 'POST',
        headers: contentType === undefined ? {} : { 'content-type': contentType },
    });

    return () => assertRequestContentType(event, types);
}

function statusOf(fn: () => unknown) {
    try {
        fn();
    } catch (e) {
        expect(e).toBeInstanceOf(AppError);

        return (e as AppError).status;
    }

    return undefined;
}

describe('assertRequestContentType', () => {
    it('should return the lowercased media type without parameters', () => {
        expect(run('Application/JSON; charset=utf-8', 'application/json')()).toBe('application/json');
    });

    it('should throw 415 for a missing header', () => {
        expect(statusOf(run(undefined, 'application/json'))).toBe(415);
    });

    it('should throw 400 for malformed values', () => {
        expect(statusOf(run('json', 'application/json'))).toBe(400);
        expect(statusOf(run('/json', 'application/json'))).toBe(400);
        expect(statusOf(run('application/', 'application/json'))).toBe(400);
    });

    it('should throw 415 naming the expected types when not listed', () => {
        const fn = run('text/plain', ['application/json', 'text/html']);

        expect(statusOf(fn)).toBe(415);
        expect(() => fn()).toThrow(/application\/json.*text\/html/);
    });

    it('should strip parameters on the expected side', () => {
        expect(run('application/json', 'application/json; charset=utf-8')()).toBe('application/json');
    });

    it('should match case-insensitively on the expected side', () => {
        expect(run('application/json', 'Application/JSON')()).toBe('application/json');
    });

    it('should support type wildcards', () => {
        expect(run('image/png', 'image/*')()).toBe('image/png');
        expect(statusOf(run('text/png', 'image/*'))).toBe(415);
    });

    it('should support +suffix patterns', () => {
        expect(run('application/vnd.api+json', 'application/*+json')()).toBe('application/vnd.api+json');
        expect(statusOf(run('application/vnd.api+xml', 'application/*+json'))).toBe(415);
    });

    it('should not match plain application/json with a +json pattern', () => {
        expect(statusOf(run('application/json', 'application/*+json'))).toBe(415);
    });

    it('should support a wildcard inside an array of types', () => {
        expect(run('image/png', ['application/json', 'image/*'])()).toBe('image/png');
        expect(statusOf(run('text/plain', ['application/json', 'image/*']))).toBe(415);
    });

    it('should accept any of an array of types', () => {
        expect(run('text/html', ['application/json', 'text/html'])()).toBe('text/html');
    });

    it('should answer 415 through app.fetch()', async () => {
        const app = new App();

        app.post('/', defineCoreHandler((event) => assertRequestContentType(event, 'application/json')));

        const bad = await app.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'text/plain' },
        }));

        expect(bad.status).toBe(415);

        const ok = await app.fetch(createTestRequest('/', {
            method: 'POST',
            headers: { 'content-type': 'application/json; charset=utf-8' },
        }));

        expect(ok.status).toBe(200);
        expect(await ok.text()).toBe('application/json');
    });

    it('should reject media types with invalid token characters', () => {
        expect(statusOf(run('image/png garbage', 'image/png'))).toBe(400);
        expect(statusOf(run('image/png garbage', 'image/*'))).toBe(400);
        expect(statusOf(run('text/ plain', 'text/plain'))).toBe(400);
        expect(run('text/plain;charset=utf-8', 'text/plain')()).toBe('text/plain');
    });
});
