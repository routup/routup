import type {
    EtagFn, EtagInput, TrustProxyFn, TrustProxyInput,
} from '../utils';

export type Options = {
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
