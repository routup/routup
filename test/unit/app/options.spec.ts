import { describe, expect, it } from 'vitest';
import { DispatcherEvent } from '../../../src/dispatcher/module';
import type { AppPathNode } from '../../../src/app';
import { createTestRequest } from '../../helpers';

function node(options: AppPathNode['options']): AppPathNode {
    return { options };
}

function createEvent(nodes: AppPathNode[]) {
    const event = new DispatcherEvent(createTestRequest('/'));
    event.appPath = nodes;
    return event.build();
}

describe('src/router/options', () => {
    it('should return default when no options set', () => {
        const event = createEvent([]);
        expect(typeof event.appOptions.trustProxy).toBe('function');
        expect(event.appOptions.trustProxy('127.0.0.1', 0)).toBe(false);
    });

    it('should return default when path is empty', () => {
        expect(createEvent([]).appOptions.subdomainOffset).toBe(2);
    });

    it('should return option set for router', () => {
        const event = createEvent([node({ subdomainOffset: 5 })]);
        expect(event.appOptions.subdomainOffset).toBe(5);
    });

    it('should walk path from end to find nearest option', () => {
        const parent = node({ subdomainOffset: 3 });
        const child = node({ subdomainOffset: 7 });

        expect(createEvent([parent, child]).appOptions.subdomainOffset).toBe(7);
        expect(createEvent([parent]).appOptions.subdomainOffset).toBe(3);
    });

    it('should fall back to parent when child has no option', () => {
        const parent = node({ subdomainOffset: 4 });
        const child = node({});

        expect(createEvent([parent, child]).appOptions.subdomainOffset).toBe(4);
    });

    it('should return default when no node has the option', () => {
        expect(createEvent([node({})]).appOptions.subdomainOffset).toBe(2);
    });
});
