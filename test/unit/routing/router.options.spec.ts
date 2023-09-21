import { findRouterOption, setRouterOptions, unsetRouterOptions } from '../../../src/router-options';

describe('src/config/**', () => {
    it('should use default values', () => {
        const subdomainOffset = findRouterOption('subdomainOffset');
        expect(subdomainOffset).toEqual(2);

        const proxyIpMax = findRouterOption('proxyIpMax');
        expect(proxyIpMax).toEqual(0);
    });

    it('should apply and revoke values', () => {
        setRouterOptions(1, { subdomainOffset: 5 });
        expect(findRouterOption('subdomainOffset', [1])).toEqual(5);

        unsetRouterOptions(1);
        expect(findRouterOption('subdomainOffset', [1])).toEqual(2);
    });
});
