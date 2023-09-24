import type { Path } from '../path';
import type {
    EtagFn, EtagInput, TrustProxyFn, TrustProxyInput,
} from '../utils';

export type RouterOptions = {
    /**
     * The path the router is mounted on.
     *
     * @type string
     * @default '/'
     */
    path?: Path,

    /**
     * default: 2
     */
    subdomainOffset: number,

    /**
     * default: 0
     */
    proxyIpMax: number,

    /**
     * default: () => true
     */
    etag: EtagFn,

    /**
     * default: () => false
     */
    trustProxy: TrustProxyFn,
};

export type RouterOptionsInput = Omit<Partial<RouterOptions>, 'etag' | 'trustProxy'> & {
    /**
     * default: true
     */
    etag?: EtagInput,

    /**
     * default: false
     */
    trustProxy?: TrustProxyInput,
};
