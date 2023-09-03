import type { EtagFn, TrustProxyFn } from '../../src';
import {
    buildEtagFn, buildTrustProxyFn, getConfigOption,
    setConfigOption, useConfig,
} from '../../src';

describe('src/config/**', () => {
    it('should use same instance', () => {
        const config = useConfig();

        expect(config).toStrictEqual(useConfig());
    });

    it('should set, get option', () => {
        const config = useConfig();

        const defaultOption = config.getDefault('env');
        expect(defaultOption).toBeDefined();

        expect(config.has('env')).toBeFalsy();
        expect(config.get('env')).toEqual(defaultOption);

        config.setRaw({
            env: 'production',
        });
        expect(config.get('env')).toEqual('production');
        expect(config.get('env')).not.toEqual(defaultOption);

        config.reset('env');
        expect(config.get('env')).toEqual(defaultOption);

        config.reset();

        config.setRaw({
            trustProxy: false,
            subdomainOffset: -1,
            etag: false,
        });

        expect(config.get('trustProxy')).toBeDefined();
        expect(config.get('subdomainOffset')).toEqual(2);
        expect(config.get('etag')).toBeDefined();
    });

    it('should set, get options', () => {
        const config = useConfig();

        expect(config.has('proxyIpMax')).toBeFalsy();

        config.set('proxyIpMax', 5);

        expect(config.has('proxyIpMax')).toBeTruthy();
        expect(config.get('proxyIpMax')).toEqual(5);

        config.reset(['proxyIpMax']);
        expect(config.has('proxyIpMax')).toBeFalsy();

        config.reset();
        expect(config.has('proxyIpMax')).toBeFalsy();
    });

    it('should overwrite execution', () => {
        const config = useConfig();

        expect(config.getDefault('proxyIpMax')).toEqual(0);
        expect(config.has('proxyIpMax')).toBeFalsy();
        expect(config.get('proxyIpMax')).toEqual(0);

        config.setDefault('proxyIpMax', 5);
        expect(config.getDefault('proxyIpMax')).toEqual(5);
        expect(config.get('proxyIpMax')).toEqual(5);

        config.resetDefault('proxyIpMax');
    });

    it('should use accessors', () => {
        setConfigOption('env', 'development');
        expect(getConfigOption('env')).toEqual('development');

        const config = useConfig();
        config.reset('env');
    });

    it('should build etag option', async () => {
        const defaultFn : EtagFn = () => Promise.resolve(undefined);

        let fn = buildEtagFn(defaultFn);
        expect(fn).toEqual(defaultFn);

        fn = buildEtagFn(false);
        expect(fn).toBeDefined();
        expect(await fn('foo')).toBeUndefined();

        fn = buildEtagFn({ threshold: 10_000 });
        expect(fn).toBeDefined();
        expect(await fn('foo')).toBeUndefined();
    });

    it('should build trust proxy fn', () => {
        const defaultFn : TrustProxyFn = () => true;

        let fn = buildTrustProxyFn(defaultFn);
        expect(fn).toEqual(defaultFn);

        fn = buildTrustProxyFn(true);
        expect(fn).toBeDefined();
        expect(fn('127.0.0.1', 0)).toEqual(true);

        fn = buildTrustProxyFn(2);
        expect(fn).toBeDefined();
        expect(fn('127.0.0.1', 1)).toBeTruthy();
        expect(fn('127.0.0.1', 3)).toBeFalsy();

        fn = buildTrustProxyFn('127.0.0.1,192.168.27.1');
        expect(fn).toBeDefined();
    });
});
