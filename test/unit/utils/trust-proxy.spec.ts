import type { TrustProxyFn } from '../../../src';
import {
    buildTrustProxyFn,
} from '../../../src';

describe('src/utils/trust-proxy', () => {
    it('should build trust proxy fn', () => {
        const defaultFn : TrustProxyFn = () => true;

        let fn = buildTrustProxyFn(defaultFn);
        expect(fn).toEqual(defaultFn);

        fn = buildTrustProxyFn(true);
        expect(fn).toBeDefined();
        expect(fn('127.0.0.1', 0)).toEqual(true);

        fn = buildTrustProxyFn(2);
        expect(fn).toBeDefined();
        expect(fn('127.0.0.1', 1)).toBeTruthy();
        expect(fn('127.0.0.1', 3)).toBeFalsy();

        fn = buildTrustProxyFn('127.0.0.1,192.168.27.1');
        expect(fn).toBeDefined();
    });
});
