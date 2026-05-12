import { describe, expect, it } from 'vitest';
import { DEFAULT_ROUTER_OPTIONS, mergeRouterOptions } from '../../../src/router/options';
import type { RouterOptions } from '../../../src/router/types';

function merge(...layers: Partial<RouterOptions>[]): RouterOptions {
    let resolved: RouterOptions = DEFAULT_ROUTER_OPTIONS;
    for (const layer of layers) {
        resolved = mergeRouterOptions(resolved, layer);
    }
    return resolved;
}

describe('src/router/options', () => {
    it('should return default when no options set', () => {
        const resolved = merge();
        expect(typeof resolved.trustProxy).toBe('function');
        expect(resolved.trustProxy('127.0.0.1', 0)).toBe(false);
    });

    it('should return default when path is empty', () => {
        expect(merge().subdomainOffset).toBe(2);
    });

    it('should return option set for router', () => {
        expect(merge({ subdomainOffset: 5 }).subdomainOffset).toBe(5);
    });

    it('should walk path from end to find nearest option', () => {
        const parent = { subdomainOffset: 3 };
        const child = { subdomainOffset: 7 };

        expect(merge(parent, child).subdomainOffset).toBe(7);
        expect(merge(parent).subdomainOffset).toBe(3);
    });

    it('should fall back to parent when child has no option', () => {
        const parent = { subdomainOffset: 4 };
        const child = {};

        expect(merge(parent, child).subdomainOffset).toBe(4);
    });

    it('should return default when no layer has the option', () => {
        expect(merge({}).subdomainOffset).toBe(2);
    });
});
