import { describe, expect, it } from 'vitest';
import { isRequestCacheable } from '../../../src';
import { createTestEvent } from '../../helpers';

describe('src/helpers/request/cache', () => {
    it('should be cacheable', () => {
        const event = createTestEvent('/', { headers: { 'if-modified-since': new Date(Date.now() + 3_600_000).toUTCString() } });

        expect(isRequestCacheable(event, new Date())).toBe(true);
    });

    it('should not be cacheable', () => {
        const event = createTestEvent('/');

        expect(isRequestCacheable(event, new Date())).toBe(false);
    });
});
