import {
    describe, 
    expect, 
    it, 
    vi,
} from 'vitest';
import {
    App,
    HeaderName,
    defineCoreHandler,
    setResponseServerTiming,
    withResponseServerTiming,
} from '../../../src';
import { createTestEvent, createTestRequest } from '../../helpers';

describe('src/response/helpers/server-timing', () => {
    it('should set a single metric', () => {
        const event = createTestEvent('/');

        setResponseServerTiming(event, 'db', { dur: 53.2, desc: 'query' });

        expect(event.response.headers.get(HeaderName.SERVER_TIMING))
            .toEqual('db;desc="query";dur=53.2');
    });

    it('should set a metric without options', () => {
        const event = createTestEvent('/');

        setResponseServerTiming(event, 'miss');

        expect(event.response.headers.get(HeaderName.SERVER_TIMING)).toEqual('miss');
    });

    it('should append metrics in order', () => {
        const event = createTestEvent('/');

        setResponseServerTiming(event, 'a', { dur: 1 });
        setResponseServerTiming(event, 'b', { dur: 0 });

        expect(event.response.headers.get(HeaderName.SERVER_TIMING))
            .toEqual('a;dur=1, b;dur=0');
    });

    it('should escape desc', () => {
        const event = createTestEvent('/');

        setResponseServerTiming(event, 'x', { desc: 'a"b\\c' });

        expect(event.response.headers.get(HeaderName.SERVER_TIMING))
            .toEqual('x;desc="a\\"b\\\\c"');
    });

    it('should reject invalid names and durations', () => {
        const event = createTestEvent('/');

        expect(() => setResponseServerTiming(event, 'a b')).toThrow(TypeError);
        expect(() => setResponseServerTiming(event, '')).toThrow(TypeError);
        expect(() => setResponseServerTiming(event, 'a', { dur: -1 })).toThrow(TypeError);
        expect(() => setResponseServerTiming(event, 'a', { dur: NaN })).toThrow(TypeError);
        expect(() => setResponseServerTiming(event, 'a', { dur: Infinity })).toThrow(TypeError);
        expect(event.response.headers.has(HeaderName.SERVER_TIMING)).toBe(false);
    });

    it('should return the value and record the duration', async () => {
        const event = createTestEvent('/');
        const value = await withResponseServerTiming(event, 'job', async () => 42, { desc: 'd' });

        expect(value).toBe(42);
        expect(event.response.headers.get(HeaderName.SERVER_TIMING))
            .toMatch(/^job;desc="d";dur=\d+(\.\d+)?$/);
    });

    it('should record and re-throw when fn throws', async () => {
        const event = createTestEvent('/');

        await expect(withResponseServerTiming(event, 'job', () => {
            throw new Error('boom');
        })).rejects.toThrow('boom');

        expect(event.response.headers.get(HeaderName.SERVER_TIMING)).toMatch(/^job;dur=/);
    });

    it('should be present on the app response', async () => {
        const app = new App();

        app.get('/', defineCoreHandler(async (event) => {
            await withResponseServerTiming(event, 'work', () => 1);

            return 'ok';
        }));

        const response = await app.fetch(createTestRequest('/'));

        expect(response.headers.get(HeaderName.SERVER_TIMING)).toMatch(/^work;dur=/);
    });

    it('should validate the name before calling fn', async () => {
        const event = createTestEvent('/');
        const fn = vi.fn(() => {
            throw new Error('fn error');
        });

        await expect(withResponseServerTiming(event, 'bad name', fn)).rejects.toThrow(TypeError);

        expect(fn).not.toHaveBeenCalled();
    });

    it.each([
        ['a newline', 'query\nplan'],
        ['a carriage return', 'query\rplan'],
        ['a NUL', 'query\0plan'],
        ['a code point above 0xFF', 'query \u2014 plan'],
    ])('should reject a description with %s', (_, desc) => {
        const event = createTestEvent('/');

        expect(() => setResponseServerTiming(event, 'db', { desc })).toThrow(TypeError);
        expect(event.response.headers.get(HeaderName.SERVER_TIMING)).toBeNull();
    });

    it('should allow tabs and Latin-1 characters in a description', () => {
        const event = createTestEvent('/');

        setResponseServerTiming(event, 'db', { desc: 'caf\u00e9\tquery' });

        expect(event.response.headers.get(HeaderName.SERVER_TIMING))
            .toEqual('db;desc="caf\u00e9\tquery"');
    });

    it.each([
        ['a newline', 'query\nplan'],
        ['a code point above 0xFF', 'query \u2014 plan'],
    ])('should reject a description with %s before running the callback', async (_, desc) => {
        const event = createTestEvent('/');
        const fn = vi.fn();

        await expect(withResponseServerTiming(event, 'db', fn, { desc })).rejects.toThrow(TypeError);
        expect(fn).not.toHaveBeenCalled();
    });
});
