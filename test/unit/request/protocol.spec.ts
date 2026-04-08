import { describe, expect, it } from 'vitest';
import { HeaderName, getRequestProtocol } from '../../../src';
import { createTestEvent } from '../../helpers';

describe('src/helpers/request/protocol', () => {
    it('should determine protocol from url', () => {
        const event = createTestEvent('http://localhost/');

        expect(getRequestProtocol(event)).toEqual('http');
    });

    it('should determine protocol with default', () => {
        const event = createTestEvent('/');

        expect(getRequestProtocol(event, {
            default: 'http',
            trustProxy: true,
        })).toEqual('http');
    });

    it('should not use x-forwarded-proto without trust proxy', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.X_FORWARDED_PROTO]: 'https' } });

        expect(getRequestProtocol(event)).toEqual('http');
    });

    it('should use x-forwarded-proto with trust proxy', () => {
        const event = createTestEvent('/', { ip: '10.0.0.1', headers: { [HeaderName.X_FORWARDED_PROTO]: 'https' } });

        expect(getRequestProtocol(event, { trustProxy: true })).toEqual('https');
    });

    it('should ignore forwarded proto when IP is unavailable', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.X_FORWARDED_PROTO]: 'https' } });

        expect(getRequestProtocol(event, { trustProxy: true })).toEqual('http');
    });
});
