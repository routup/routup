/*
 * Copyright (c) 2021.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import zod from 'zod';
import { Config } from './module';
import {
    ConfigOptions, ConfigOptionsInput, EtagInput, TrustProxyInput,
} from './type';
import { buildConfigEtagOption, buildConfigTrustProxyOption } from './utils';

let instance : Config<ConfigOptions, ConfigOptionsInput> | undefined;

export function useConfig() : Config<ConfigOptions, ConfigOptionsInput> {
    if (typeof instance !== 'undefined') {
        return instance;
    }

    instance = new Config<ConfigOptions, ConfigOptionsInput>({
        defaults: {
            env: process.env.NODE_ENV || 'development',
            trustProxy: () => false,
            subdomainOffset: 2,
            etag: buildConfigEtagOption(),
            proxyIpHeader: 'X-Forwarded-For',
            proxyIpMax: 0,
            caseSensitive: true,
            requestIdHeader: 'request-id',
        },
        transformers: {
            etag: (value) => buildConfigEtagOption(value as EtagInput),
            trustProxy: (value) => buildConfigTrustProxyOption(value as TrustProxyInput),
        },
        validators: {
            env: (value) => zod.string().safeParse(value),
            trustProxy: (value) => zod.any().safeParse(value),
            subdomainOffset: (value) => zod.number().nonnegative().safeParse(value),
            etag: (value) => zod.any().safeParse(value),
            proxyIpHeader: (value) => zod.string().min(3).safeParse(value),
            proxyIpMax: (value) => zod.number().nonnegative().safeParse(value),
            caseSensitive: (value) => zod.boolean().safeParse(value),
            requestIdHeader: (value) => zod.string().min(3).safeParse(value),
        },
    });

    return instance;
}
