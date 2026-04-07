import { describe, expect, it } from 'vitest';
import { RoutupEvent } from '../../../src/event';
import type { RouterPathNode } from '../../../src/router';
import { getRouterOption } from '../../../src/helpers/get-router-option';
import { createTestRequest } from '../../helpers';

function node(config: RouterPathNode['config']): RouterPathNode {
    return { config };
}

function createEvent(nodes: RouterPathNode[]) {
    const event = new RoutupEvent(createTestRequest('/'));
    event.routerPath = nodes;
    return event;
}

describe('src/router/options', () => {
    it('should return default when no options set', () => {
        const trustProxy = getRouterOption(createEvent([]), 'trustProxy');
        expect(typeof trustProxy).toBe('function');
        expect(trustProxy('127.0.0.1', 0)).toBe(false);
    });

    it('should return default when path is empty', () => {
        const subdomainOffset = getRouterOption(createEvent([]), 'subdomainOffset');
        expect(subdomainOffset).toBe(2);
    });

    it('should return option set for router', () => {
        const result = getRouterOption(
            createEvent([node({ subdomainOffset: 5 })]),
            'subdomainOffset',
        );
        expect(result).toBe(5);
    });

    it('should walk path from end to find nearest option', () => {
        const parent = node({ subdomainOffset: 3 });
        const child = node({ subdomainOffset: 7 });

        expect(getRouterOption(createEvent([parent, child]), 'subdomainOffset')).toBe(7);
        expect(getRouterOption(createEvent([parent]), 'subdomainOffset')).toBe(3);
    });

    it('should fall back to parent when child has no option', () => {
        const parent = node({ subdomainOffset: 4 });
        const child = node({});

        expect(getRouterOption(createEvent([parent, child]), 'subdomainOffset')).toBe(4);
    });

    it('should return default when no node has the option', () => {
        expect(getRouterOption(createEvent([node({})]), 'subdomainOffset')).toBe(2);
    });
});
