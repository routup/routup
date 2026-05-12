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

describe('src/config/**', () => {
    it('should use default values', () => {
        const resolved = merge();

        expect(resolved.subdomainOffset).toEqual(2);
        expect(resolved.proxyIpMax).toEqual(0);
    });

    it('should apply values from layer', () => {
        expect(merge({ subdomainOffset: 5 }).subdomainOffset).toEqual(5);
    });

    it('should return default when layer has no option', () => {
        expect(merge({}).subdomainOffset).toEqual(2);
    });
});
