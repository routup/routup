import { describe, expect, it } from 'vitest';
import { DispatcherEvent } from '../../../src/dispatcher/module';
import type { RouterPathNode } from '../../../src/router';
import { createTestRequest } from '../../helpers';

function node(options: RouterPathNode['options']): RouterPathNode {
    return { options };
}

function createEvent(nodes: RouterPathNode[]) {
    const event = new DispatcherEvent(createTestRequest('/'));
    event.routerPath = nodes;
    return event.build();
}

describe('src/config/**', () => {
    it('should use default values', () => {
        const event = createEvent([]);

        expect(event.routerOptions.subdomainOffset).toEqual(2);
        expect(event.routerOptions.proxyIpMax).toEqual(0);
    });

    it('should apply values from node', () => {
        const event = createEvent([node({ subdomainOffset: 5 })]);
        expect(event.routerOptions.subdomainOffset).toEqual(5);
    });

    it('should return default when node has no option', () => {
        const event = createEvent([node({})]);
        expect(event.routerOptions.subdomainOffset).toEqual(2);
    });
});
