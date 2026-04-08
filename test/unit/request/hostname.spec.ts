import { describe, expect, it } from 'vitest';
import { HeaderName, getRequestHostName } from '../../../src';
import { createTestEvent } from '../../helpers';

describe('src/helpers/request/hostname', () => {
    it('should determine hostname', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.HOST]: 'example.com' } });

        expect(getRequestHostName(event)).toEqual('example.com');
    });

    it('should determine hostname without port', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.HOST]: 'example.com:3000' } });

        expect(getRequestHostName(event)).toEqual('example.com');
    });

    it('should determine hostname for IPv6', () => {
        const event1 = createTestEvent('/', { headers: { [HeaderName.HOST]: '[::1]' } });

        expect(getRequestHostName(event1)).toEqual('[::1]');

        const event2 = createTestEvent('/', { headers: { [HeaderName.HOST]: '[::1]:3000' } });

        expect(getRequestHostName(event2)).toEqual('[::1]');
    });

    it('should determine hostname with trust proxy', () => {
        const event1 = createTestEvent('/', {
            ip: '10.0.0.1',
            headers: {
                [HeaderName.HOST]: 'localhost',
                [HeaderName.X_FORWARDED_HOST]: 'example.com:3000',
            },
        });

        expect(getRequestHostName(event1, { trustProxy: true })).toEqual('example.com');

        const event2 = createTestEvent('/', {
            ip: '10.0.0.1',
            headers: {
                [HeaderName.HOST]: 'localhost',
                [HeaderName.X_FORWARDED_HOST]: 'example.com, foobar.com',
            },
        });

        expect(getRequestHostName(event2, { trustProxy: true })).toEqual('example.com');

        const event3 = createTestEvent('/', {
            ip: '10.0.0.1',
            headers: {
                [HeaderName.HOST]: 'localhost',
                [HeaderName.X_FORWARDED_HOST]: 'example.com:3000 , foobar.com:3000',
            },
        });

        expect(getRequestHostName(event3, { trustProxy: true })).toEqual('example.com');
    });

    it('should ignore forwarded host when IP is unavailable', () => {
        const event = createTestEvent('/', {
            headers: {
                [HeaderName.HOST]: 'localhost',
                [HeaderName.X_FORWARDED_HOST]: 'example.com',
            },
        });

        expect(getRequestHostName(event, { trustProxy: true })).toEqual('localhost');
    });
});
