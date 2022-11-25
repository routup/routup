/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {EtagFn, getConfigOption, setConfigOption, TrustProxyFn, useConfig} from "../../src/config";
import {buildConfigEtagOption, buildConfigTrustProxyOption} from "../../src/config/utils";

describe('src/config/**', () => {
    it('should use same instance', () => {
        const config = useConfig();

        expect(config).toStrictEqual(useConfig());
    });

    it('should set, get option', () => {
        const config = useConfig();

        const defaultOption = config.getDefault('env');
        expect(defaultOption).toBeDefined();

        expect(config.getRaw('env')).toBeUndefined();
        expect(config.has('env')).toBeFalsy();
        expect(config.get('env')).toEqual(defaultOption);

        config.set('env', 'production');
        expect(config.get('env')).toEqual('production');
        expect(config.get('env')).not.toEqual(defaultOption);

        config.reset('env');
        expect(config.get('env')).toEqual(defaultOption);

        config.reset();
    })

    it('should set, get options', () => {
        const config = useConfig();

        expect(config.getRaw('proxyIpHeader')).toBeUndefined();
        expect(config.getRaw('proxyIpMax')).toBeUndefined();

        config.set('proxyIpHeader', 'Header');
        config.set('proxyIpMax', 5);

        expect(config.getRaw('proxyIpHeader')).toEqual('Header');
        expect(config.getRaw('proxyIpMax')).toEqual(5);

        config.reset(['proxyIpMax']);
        expect(config.getRaw('proxyIpHeader')).toEqual('Header');
        expect(config.getRaw('proxyIpMax')).toBeUndefined();

        config.reset();
        expect(config.getRaw('proxyIpHeader')).toBeUndefined();
        expect(config.getRaw('proxyIpMax')).toBeUndefined();
    });

    it('should overwrite execution', () => {
        const config = useConfig();

        expect(config.getDefault('proxyIpMax')).toBeUndefined();
        expect(config.get('proxyIpMax')).toBeUndefined();

        config.setDefault('proxyIpMax', 5);
        expect(config.getDefault('proxyIpMax')).toEqual(5);
        expect(config.get('proxyIpMax')).toEqual(5);

        config.setDefault('proxyIpMax', undefined);
    })

    it('should use accessors', () => {
        setConfigOption('env', 'development');
        expect(getConfigOption('env')).toEqual('development');

        const config = useConfig();
        config.reset('env');
    })

    it('should build etag option', () => {
        const defaultFn : EtagFn = () => undefined;

        let fn = buildConfigEtagOption(defaultFn);
        expect(fn).toEqual(defaultFn);

        fn = buildConfigEtagOption(false);
        expect(fn).toBeDefined();
        expect(fn('foo')).toBeUndefined();

        fn = buildConfigEtagOption({ threshold: 10_000 });
        expect(fn).toBeDefined();
        expect(fn('foo')).toBeUndefined();
    })

    it('should build trust proxy fn', () => {
        const defaultFn : TrustProxyFn = () => true;

        let fn = buildConfigTrustProxyOption(defaultFn);
        expect(fn).toEqual(defaultFn);

        fn = buildConfigTrustProxyOption(true);
        expect(fn).toBeDefined();
        expect(fn('127.0.0.1', 0)).toEqual(true);

        fn = buildConfigTrustProxyOption(2);
        expect(fn).toBeDefined();
        expect(fn('127.0.0.1', 1)).toBeTruthy();
        expect(fn('127.0.0.1', 3)).toBeFalsy();

        fn = buildConfigTrustProxyOption('127.0.0.1,192.168.27.1');
        expect(fn).toBeDefined();
    })
})
