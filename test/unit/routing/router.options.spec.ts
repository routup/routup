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

describe('src/config/**', () => {
    it('should use default values', () => {
        const event = createEvent([]);

        expect(event.appOptions.subdomainOffset).toEqual(2);
        expect(event.appOptions.proxyIpMax).toEqual(0);
    });

    it('should apply values from node', () => {
        const event = createEvent([node({ subdomainOffset: 5 })]);
        expect(event.appOptions.subdomainOffset).toEqual(5);
    });

    it('should return default when node has no option', () => {
        const event = createEvent([node({})]);
        expect(event.appOptions.subdomainOffset).toEqual(2);
    });
});
