import { describe, expect, it } from 'vitest';
import { RoutupEvent } from '../../../src/event/module';
import { HeaderName, getRequestIP } from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/helpers/request/ip', () => {
    it('should determine address from request.ip', () => {
        const event = new RoutupEvent(createTestRequest('/', { ip: '127.0.0.1' }));

        expect(getRequestIP(event)).toEqual('127.0.0.1');
    });

    it('should determine address from x-forwarded-for with trust proxy', () => {
        const event = new RoutupEvent(createTestRequest('/', { headers: { [HeaderName.X_FORWARDED_FOR]: '192.168.0.1, 10.0.0.1' } }));

        expect(getRequestIP(event, { trustProxy: true })).toEqual('192.168.0.1');
    });

    it('should not use x-forwarded-for without trust proxy', () => {
        const event = new RoutupEvent(createTestRequest('/', { headers: { [HeaderName.X_FORWARDED_FOR]: '192.168.0.1, 10.0.0.1' } }));

        expect(getRequestIP(event, { trustProxy: false })).toBeUndefined();
    });

    it('should prefer x-forwarded-for over request.ip when trusted', () => {
        const event = new RoutupEvent(createTestRequest('/', {
            ip: '10.0.0.1',
            headers: { [HeaderName.X_FORWARDED_FOR]: '203.0.113.50' },
        }));

        expect(getRequestIP(event, { trustProxy: true })).toEqual('203.0.113.50');
    });

    it('should use request.ip when trusted but no forwarded header', () => {
        const event = new RoutupEvent(createTestRequest('/', { ip: '10.0.0.1' }));

        expect(getRequestIP(event, { trustProxy: true })).toEqual('10.0.0.1');
    });

    it('should return undefined when no ip available', () => {
        const event = new RoutupEvent(createTestRequest('/'));

        expect(getRequestIP(event)).toBeUndefined();
    });
});
