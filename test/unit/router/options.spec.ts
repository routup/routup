import { describe, expect, it } from 'vitest';
import {
    findRouterOption,
    setRouterOptions,
    unsetRouterOptions,
} from '../../../src/router-options/module';

describe('src/router-options/module', () => {
    it('should return default when no options set', () => {
        const trustProxy = findRouterOption('trustProxy', []);
        expect(typeof trustProxy).toBe('function');
        expect(trustProxy('127.0.0.1', 0)).toBe(false);
    });

    it('should return default when path is empty', () => {
        const subdomainOffset = findRouterOption('subdomainOffset');
        expect(subdomainOffset).toBe(2);
    });

    it('should return option set for router id', () => {
        const id = 9999;
        setRouterOptions(id, { subdomainOffset: 5 });

        const result = findRouterOption('subdomainOffset', [id]);
        expect(result).toBe(5);

        unsetRouterOptions(id);
    });

    it('should walk path from end to find nearest option', () => {
        const parent = 9990;
        const child = 9991;

        setRouterOptions(parent, { subdomainOffset: 3 });
        setRouterOptions(child, { subdomainOffset: 7 });

        expect(findRouterOption('subdomainOffset', [parent, child])).toBe(7);
        expect(findRouterOption('subdomainOffset', [parent])).toBe(3);

        unsetRouterOptions(parent);
        unsetRouterOptions(child);
    });

    it('should fall back to parent when child has no option', () => {
        const parent = 9992;
        const child = 9993;

        setRouterOptions(parent, { subdomainOffset: 4 });
        setRouterOptions(child, {});

        expect(findRouterOption('subdomainOffset', [parent, child])).toBe(4);

        unsetRouterOptions(parent);
        unsetRouterOptions(child);
    });

    it('should clean up with unsetRouterOptions', () => {
        const id = 9994;
        setRouterOptions(id, { subdomainOffset: 10 });
        unsetRouterOptions(id);

        expect(findRouterOption('subdomainOffset', [id])).toBe(2);
    });
});
