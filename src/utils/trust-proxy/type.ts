export type TrustProxyFn = (address: string, hop: number) => boolean;

export type TrustProxyInput = boolean | number | string | string[] | TrustProxyFn;
