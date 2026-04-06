import { describe, expect, it } from 'vitest';
import { RoutupEvent } from '../../../src/event/module';
import { HeaderName, getRequestProtocol } from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/helpers/request/protocol', () => {
    it('should determine protocol from url', () => {
        const event = new RoutupEvent(createTestRequest('http://localhost/'));

        expect(getRequestProtocol(event)).toEqual('http');
    });

    it('should determine protocol with default', () => {
        const event = new RoutupEvent(createTestRequest('/'));

        expect(getRequestProtocol(event, {
            default: 'http',
            trustProxy: true,
        })).toEqual('http');
    });

    it('should not use x-forwarded-proto without trust proxy', () => {
        const event = new RoutupEvent(createTestRequest('/', { headers: { [HeaderName.X_FORWARDED_PROTO]: 'https' } }));

        expect(getRequestProtocol(event)).toEqual('http');
    });

    it('should use x-forwarded-proto with trust proxy', () => {
        const event = new RoutupEvent(createTestRequest('/', { ip: '10.0.0.1', headers: { [HeaderName.X_FORWARDED_PROTO]: 'https' } }));

        expect(getRequestProtocol(event, { trustProxy: true })).toEqual('https');
    });

    it('should ignore forwarded proto when IP is unavailable', () => {
        const event = new RoutupEvent(createTestRequest('/', { headers: { [HeaderName.X_FORWARDED_PROTO]: 'https' } }));

        expect(getRequestProtocol(event, { trustProxy: true })).toEqual('http');
    });
});
