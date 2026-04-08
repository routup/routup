import { describe, expect, it } from 'vitest';
import { createTestEvent } from '../../helpers';

describe('src/event/store', () => {
    it('should set & get values', () => {
        const event = createTestEvent('/');

        event.store.foo = 'bar';
        event.store.bar = 'baz';

        expect(event.store.foo).toBe('bar');
        expect(event.store.bar).toBe('baz');
    });

    it('should support symbol keys', () => {
        const event = createTestEvent('/');
        const key = Symbol.for('test:key');

        event.store[key] = 'value';

        expect(event.store[key]).toBe('value');
    });

    it('should delete values', () => {
        const event = createTestEvent('/');

        event.store.foo = 'bar';
        delete event.store.foo;

        expect(event.store.foo).toBeUndefined();
    });

    it('should start empty', () => {
        const event = createTestEvent('/');

        expect(Object.keys(event.store)).toEqual([]);
    });

    it('should not have prototype properties', () => {
        const event = createTestEvent('/');

        expect(event.store.toString).toBeUndefined();
        expect(event.store.hasOwnProperty).toBeUndefined();
    });
});
