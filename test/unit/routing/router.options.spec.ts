import { findRouterOption, setRouterOptions, unsetRouterOptions } from '../../../src/router-options';

describe('src/config/**', () => {
    it('should use default values', () => {
        const subdomainOffset = findRouterOption('subdomainOffset');
        expect(subdomainOffset).toEqual(2);

        const proxyIpMax = findRouterOption('proxyIpMax');
        expect(proxyIpMax).toEqual(0);
    });

    it('should apply and revoke values', () => {
        const id = 1;

        setRouterOptions(id, { subdomainOffset: 5 });
        expect(findRouterOption('subdomainOffset', id)).toEqual(5);

        unsetRouterOptions(id);
        expect(findRouterOption('subdomainOffset', id)).toEqual(2);
    });
});
