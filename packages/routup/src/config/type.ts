/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Options as EtagBaseOptions } from 'etag';
import { ObjectLiteral } from '../type';

export type EtagOptions = EtagBaseOptions & {
    /**
     * Threshold of bytes from which an etag is generated.
     *
     * default: undefined
     */
    threshold?: number
};

export type EtagFn = (body: any, encoding?: BufferEncoding, size?: number) => string | undefined;
export type TrustProxyFn = (address: string, hop: number) => boolean;

export type ConfigOptions = {
    /**
     * default: process.NODE_ENV
     */
    env: string,
    /**
     * default: () => false
     */
    trustProxy: TrustProxyFn,
    /**
     * default: 2
     */
    subdomainOffset: number,
    /**
     * default: () => true
     */
    etag: EtagFn,

    /**
     * Default: X-Forwarded-For
     */
    proxyIpHeader: string,

    /**
     * default: undefined
     */
    proxyIpMax?: number,

    /**
     * default: true
     */
    caseSensitive: boolean,

    /**
     * default: request-id
     */
    requestIdHeader: string,
};

export type ConfigOptionsInput = {
    /**
     * default: true
     */
    etag?: boolean | EtagOptions | EtagFn,

    /**
     * default: false
     */
    trustProxy?: boolean | number | string | string[] | TrustProxyFn,
} & Partial<Omit<ConfigOptions, 'etag' | 'trustProxy'>>;

export type ConfigOptionsTransformer<T extends ObjectLiteral,
    K extends keyof T = keyof T,
    > = (key: K, value: any) => T[K];

export type ConfigContext<T extends ObjectLiteral> = {
    defaults: T,
    options?: Partial<T>,
    transform: ConfigOptionsTransformer<T>
};
