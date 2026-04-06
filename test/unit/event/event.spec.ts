import { describe, expect, it } from 'vitest';
import { RoutupEvent } from '../../../src/event/module';
import { createTestRequest } from '../../helpers';

describe('src/event/module', () => {
    it('should initialize with correct properties', () => {
        const event = new RoutupEvent(createTestRequest('http://localhost/foo?bar=baz'));

        expect(event.method).toBe('GET');
        expect(event.path).toBe('/foo');
        expect(event.mountPath).toBe('/');
        expect(event.params).toEqual({});
        expect(event.dispatched).toBe(false);
    });

    it('should lazily parse searchParams', () => {
        const event = new RoutupEvent(createTestRequest('http://localhost/foo?a=1&b=2'));

        const params = event.searchParams;
        expect(params.get('a')).toBe('1');
        expect(params.get('b')).toBe('2');

        // Same instance on second access
        expect(event.searchParams).toBe(params);
    });

    it('should lazily initialize response accumulator', () => {
        const event = new RoutupEvent(createTestRequest('/'));

        const res = event.response;
        expect(res.status).toBe(200);
        expect(res.headers).toBeInstanceOf(Headers);

        // Same instance on second access
        expect(event.response).toBe(res);
    });

    it('should provide headers from request', () => {
        const event = new RoutupEvent(createTestRequest('/', { headers: { 'x-custom': 'value' } }));

        expect(event.headers.get('x-custom')).toBe('value');
    });

    it('should cache next() result on repeated calls', async () => {
        const event = new RoutupEvent(createTestRequest('/'));

        let callCount = 0;
        event._next = async () => {
            callCount++;
            return new Response('ok');
        };

        const first = await event.next();
        const second = await event.next();

        expect(callCount).toBe(1);
        expect(first).toBe(await second);
    });

    it('should return undefined from next() when no continuation set', async () => {
        const event = new RoutupEvent(createTestRequest('/'));

        const result = await event.next();
        expect(result).toBeUndefined();
    });

    it('should have an isolated store per event', () => {
        const event1 = new RoutupEvent(createTestRequest('/'));
        const event2 = new RoutupEvent(createTestRequest('/'));

        event1.store.foo = 'bar';

        expect(event1.store.foo).toBe('bar');
        expect(event2.store.foo).toBeUndefined();
    });

    it('should have a prototype-free store', () => {
        const event = new RoutupEvent(createTestRequest('/'));

        expect(event.store.toString).toBeUndefined();
        expect(event.store.hasOwnProperty).toBeUndefined();
    });

    it('should support symbol keys in store', () => {
        const event = new RoutupEvent(createTestRequest('/'));
        const key = Symbol.for('test:key');

        event.store[key] = 42;
        expect(event.store[key]).toBe(42);
    });
});
