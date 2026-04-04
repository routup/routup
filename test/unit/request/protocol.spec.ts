import { describe, expect, it } from 'vitest';
import { DispatchEvent } from '../../../src/dispatcher/event/module';
import { HeaderName, getRequestProtocol } from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/helpers/request/protocol', () => {
    it('should determine protocol from url', () => {
        const event = new DispatchEvent(createTestRequest('http://localhost/'));

        expect(getRequestProtocol(event)).toEqual('http');
    });

    it('should determine protocol with default', () => {
        const event = new DispatchEvent(createTestRequest('/'));

        expect(getRequestProtocol(event, {
            default: 'http',
            trustProxy: true,
        })).toEqual('http');
    });

    it('should not use x-forwarded-proto without trust proxy', () => {
        const event = new DispatchEvent(createTestRequest('/', { headers: { [HeaderName.X_FORWARDED_PROTO]: 'https' } }));

        expect(getRequestProtocol(event)).toEqual('http');
    });

    it('should use x-forwarded-proto with trust proxy', () => {
        const event = new DispatchEvent(createTestRequest('/', { headers: { [HeaderName.X_FORWARDED_PROTO]: 'https' } }));

        expect(getRequestProtocol(event, { trustProxy: true })).toEqual('https');
    });
});
