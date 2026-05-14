import { describe, expect, it } from 'vitest';
import { acceptsJson } from '../../../src/utils';

function make(accept?: string): Request {
    const headers = new Headers();
    if (typeof accept === 'string') {
        headers.set('accept', accept);
    }
    return new Request('http://localhost/', { headers });
}

describe('acceptsJson', () => {
    it('returns true when no Accept header is present', () => {
        expect(acceptsJson(make(undefined))).toBe(true);
    });

    it('accepts application/json', () => {
        expect(acceptsJson(make('application/json'))).toBe(true);
    });

    it('accepts +json suffixes (e.g. application/vnd.api+json)', () => {
        expect(acceptsJson(make('application/vnd.api+json'))).toBe(true);
    });

    it('accepts wildcards (*/* and application/*)', () => {
        expect(acceptsJson(make('*/*'))).toBe(true);
        expect(acceptsJson(make('application/*'))).toBe(true);
    });

    it('does NOT treat application/json-seq as JSON', () => {
        // Substring matchers would match this. Media-range parsing
        // correctly rejects it.
        expect(acceptsJson(make('application/json-seq'))).toBe(false);
    });

    it('respects q=0 (explicit rejection)', () => {
        expect(acceptsJson(make('application/json;q=0'))).toBe(false);
        expect(acceptsJson(make('text/html;q=1, application/json;q=0'))).toBe(false);
    });

    it('tolerates whitespace around the q parameter', () => {
        expect(acceptsJson(make('application/json; q=0'))).toBe(false);
        expect(acceptsJson(make('application/json; q =0'))).toBe(false);
        expect(acceptsJson(make('application/json; q = 0'))).toBe(false);
    });

    it('accepts when at least one JSON media range has q > 0', () => {
        expect(acceptsJson(make('text/html, application/json;q=0.5'))).toBe(true);
    });

    it('returns false when no acceptable JSON range is present', () => {
        expect(acceptsJson(make('text/html'))).toBe(false);
        expect(acceptsJson(make('image/png, text/plain'))).toBe(false);
    });
});
