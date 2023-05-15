import type { EtagFn, EtagInput } from '../utils/etag/type';
import type { TrustProxyFn, TrustProxyInput } from '../utils/trust-proxy';

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
