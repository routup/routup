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
export type EtagInput = boolean | EtagOptions | EtagFn;

export type TrustProxyFn = (address: string, hop: number) => boolean;
export type TrustProxyInput = boolean | number | string | string[] | TrustProxyFn;

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
     * default: 0
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
    etag?: EtagInput,

    /**
     * default: false
     */
    trustProxy?: TrustProxyInput,
} & Partial<Omit<ConfigOptions, 'etag' | 'trustProxy'>>;
export type ConfigOptionTransformer<V> = (value: unknown) => V;

export type ConfigOptionsTransformer<T extends ObjectLiteral> = {
    [K in keyof T]?: ConfigOptionTransformer<T[K]>
};

export type ConfigOptionValidatorResult<V> = {
    success: boolean,
    data: V
};

export type ConfigOptionValidator<V> = (value: unknown) => unknown;

export type ConfigOptionsValidators<T extends ObjectLiteral> = {
    [K in keyof T]?: ConfigOptionValidator<T[K]>
};

export type ConfigContext<T extends ObjectLiteral> = {
    defaults: T,
    options?: Partial<T>,
    transformers?: ConfigOptionsTransformer<T>,
    validators?: ConfigOptionsValidators<T>
};
