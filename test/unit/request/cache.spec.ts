import { describe, expect, it } from 'vitest';
import { DispatchEvent } from '../../../src/dispatcher/event/module';
import { isRequestCacheable } from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/helpers/request/cache', () => {
    it('should be cacheable', () => {
        const event = new DispatchEvent(createTestRequest('/', { headers: { 'if-modified-since': new Date(Date.now() + 3_600_000).toUTCString() } }));

        expect(isRequestCacheable(event, new Date())).toBe(true);
    });

    it('should not be cacheable', () => {
        const event = new DispatchEvent(createTestRequest('/'));

        expect(isRequestCacheable(event, new Date())).toBe(false);
    });
});
