/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { EtagFn, EtagInput } from '../utils/etag/type';
import { TrustProxyFn, TrustProxyInput } from '../utils/trust-proxy';

export type Options = {
    /**
     * default: production
     */
    env: string,

    /**
     * default: () => true
     */
    etag: EtagFn,
    /**
     * default: 2
     */
    subdomainOffset: number,
    /**
     * default: () => false
     */
    trustProxy: TrustProxyFn,

    /**
     * default: 0
     */
    proxyIpMax: number,
};

export type OptionsInput = {
    /**
     * default: true
     */
    etag?: EtagInput,

    /**
     * default: false
     */
    trustProxy?: TrustProxyInput,
} & Partial<Omit<Options, 'etag' | 'trustProxy'>>;
