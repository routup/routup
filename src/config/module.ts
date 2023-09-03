import type { FlattenObject } from 'continu';
import { Continu } from 'continu';
import zod from 'zod';
import type {
    EtagInput,
    TrustProxyInput,
} from '../utils';
import {
    buildEtagFn,
    buildTrustProxyFn,
} from '../utils';
import type { Options, OptionsInput } from './type';

let instance : Continu<Options, OptionsInput> | undefined;

export function buildConfig() {
    return new Continu<Options, OptionsInput>({
        defaults: {
            trustProxy: () => false,
            subdomainOffset: 2,
            etag: buildEtagFn(),
            proxyIpMax: 0,
        },
        transformers: {
            etag: (value) => buildEtagFn(value as EtagInput),
            trustProxy: (value) => buildTrustProxyFn(value as TrustProxyInput),
        },
        validators: {
            trustProxy: (value) => zod.any().safeParse(value),
            subdomainOffset: (value) => zod.number().nonnegative().safeParse(value),
            etag: (value) => zod.any().safeParse(value),
            proxyIpMax: (value) => zod.number().nonnegative().safeParse(value),
        },
    });
}

export function useConfig() {
    if (typeof instance !== 'undefined') {
        return instance;
    }

    instance = buildConfig();

    return instance;
}

export function setConfig(config: Continu<Options, OptionsInput>) {
    instance = config;
}

export function setConfigOption<K extends keyof FlattenObject<OptionsInput>>(
    key: K,
    value: FlattenObject<OptionsInput>[K],
) {
    const config = useConfig();

    config.setRaw(key, value);

    return config.get();
}

export function getConfigOption(key: keyof FlattenObject<OptionsInput>) {
    const config = useConfig();

    return config.get(key);
}
