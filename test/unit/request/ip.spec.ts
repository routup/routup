import { describe, expect, it } from 'vitest';
import { RoutupEvent } from '../../../src/index.ts';
import { HeaderName, getRequestIP } from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/request/helpers/ip', () => {
    it('should return socket IP by default', () => {
        const event = new RoutupEvent(createTestRequest('/', { ip: '127.0.0.1' }));

        expect(getRequestIP(event)).toEqual('127.0.0.1');
    });

    it('should return undefined when no ip available', () => {
        const event = new RoutupEvent(createTestRequest('/'));

        expect(getRequestIP(event)).toBeUndefined();
    });

    it('should ignore x-forwarded-for when proxy not trusted', () => {
        const event = new RoutupEvent(createTestRequest('/', {
            ip: '10.0.0.1',
            headers: { [HeaderName.X_FORWARDED_FOR]: '203.0.113.50' },
        }));

        expect(getRequestIP(event)).toEqual('10.0.0.1');
    });

    it('should return client IP from x-forwarded-for when all proxies trusted', () => {
        const event = new RoutupEvent(createTestRequest('/', {
            ip: '10.0.0.1',
            headers: { [HeaderName.X_FORWARDED_FOR]: '203.0.113.50, 70.41.3.18' },
        }));

        // trustProxy: true trusts all → returns leftmost (original client)
        expect(getRequestIP(event, { trustProxy: true })).toEqual('203.0.113.50');
    });

    it('should return socket IP when trusted but no forwarded header', () => {
        const event = new RoutupEvent(createTestRequest('/', { ip: '10.0.0.1' }));

        expect(getRequestIP(event, { trustProxy: true })).toEqual('10.0.0.1');
    });

    it('should return rightmost untrusted address from proxy chain', () => {
        const event = new RoutupEvent(createTestRequest('/', {
            ip: '127.0.0.1',
            headers: { [HeaderName.X_FORWARDED_FOR]: '203.0.113.50, 70.41.3.18, 10.0.0.1' },
        }));

        // Trust only loopback — socket is 127.0.0.1 (trusted), 10.0.0.1 is not trusted
        expect(getRequestIP(event, { trustProxy: 'loopback' })).toEqual('10.0.0.1');
    });

    it('should walk full chain when multiple proxies trusted', () => {
        const event = new RoutupEvent(createTestRequest('/', {
            ip: '127.0.0.1',
            headers: { [HeaderName.X_FORWARDED_FOR]: '203.0.113.50, 10.0.0.1' },
        }));

        // Trust loopback and 10.0.0.0/8 — both socket and 10.0.0.1 are trusted
        expect(getRequestIP(event, { trustProxy: ['loopback', '10.0.0.0/8'] })).toEqual('203.0.113.50');
    });

    it('should support trust proxy as number (max hops)', () => {
        const event = new RoutupEvent(createTestRequest('/', {
            ip: '127.0.0.1',
            headers: { [HeaderName.X_FORWARDED_FOR]: '203.0.113.50, 70.41.3.18, 10.0.0.1' },
        }));

        // Trust 1 hop — only socket (hop 0) is trusted
        expect(getRequestIP(event, { trustProxy: 1 })).toEqual('10.0.0.1');
    });

    it('should support trust proxy as function', () => {
        const event = new RoutupEvent(createTestRequest('/', {
            ip: '10.0.0.1',
            headers: { [HeaderName.X_FORWARDED_FOR]: '203.0.113.50' },
        }));

        // Custom function: trust 10.x.x.x addresses
        const trustFn = (addr: string) => addr.startsWith('10.');
        expect(getRequestIP(event, { trustProxy: trustFn })).toEqual('203.0.113.50');
    });
});
