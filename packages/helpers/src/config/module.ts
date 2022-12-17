/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Continu } from 'continu';
import zod from 'zod';
import {
    EtagInput, TrustProxyInput,
} from '../type';
import { buildEtagFn } from '../utils/etag';
import { buildTrustProxyFn } from '../utils/trust-proxy';
import { Options, OptionsInput } from './type';

let instance : Continu<Options, OptionsInput> | undefined;

export function buildConfig() {
    return new Continu<Options, OptionsInput>({
        defaults: {
            trustProxy: () => false,
            subdomainOffset: 2,
            etag: buildEtagFn(),
        },
        transformers: {
            etag: (value) => buildEtagFn(value as EtagInput),
            trustProxy: (value) => buildTrustProxyFn(value as TrustProxyInput),
        },
        validators: {
            trustProxy: (value) => zod.any().safeParse(value),
            subdomainOffset: (value) => zod.number().nonnegative().safeParse(value),
            etag: (value) => zod.any().safeParse(value),
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
