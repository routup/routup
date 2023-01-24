/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Continu, FlattenObject } from 'continu';
import process from 'node:process';
import zod from 'zod';
import {
    EtagInput,
    TrustProxyInput,
    buildEtagFn,
    buildTrustProxyFn,
} from '../utils';
import { Options, OptionsInput } from './type';

let instance : Continu<Options, OptionsInput> | undefined;

export function buildConfig() {
    return new Continu<Options, OptionsInput>({
        defaults: {
            env: process.env.NODE_ENV || 'development',
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
            env: (value) => zod.string().safeParse(value),
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
