import { describe, expect, it } from 'vitest';
import { RoutupEvent } from '../../../src/event';
import type { RouterPathNode } from '../../../src/router';
import { getRouterOption } from '../../../src/index.ts';
import { createTestRequest } from '../../helpers';

function node(options: RouterPathNode['options']): RouterPathNode {
    return { options };
}

function createEvent(nodes: RouterPathNode[]) {
    const event = new RoutupEvent(createTestRequest('/'));
    event.routerPath = nodes;
    return event;
}

describe('src/config/**', () => {
    it('should use default values', () => {
        const event = createEvent([]);

        const subdomainOffset = getRouterOption(event, 'subdomainOffset');
        expect(subdomainOffset).toEqual(2);

        const proxyIpMax = getRouterOption(event, 'proxyIpMax');
        expect(proxyIpMax).toEqual(0);
    });

    it('should apply values from node', () => {
        const event = createEvent([node({ subdomainOffset: 5 })]);
        expect(getRouterOption(event, 'subdomainOffset')).toEqual(5);
    });

    it('should return default when node has no option', () => {
        const event = createEvent([node({})]);
        expect(getRouterOption(event, 'subdomainOffset')).toEqual(2);
    });
});
