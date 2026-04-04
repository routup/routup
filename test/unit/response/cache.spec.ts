import { describe, expect, it } from 'vitest';
import { DispatchEvent } from '../../../src/dispatcher/event/module';
import { HeaderName, setResponseCacheHeaders } from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/helpers/response/cache', () => {
    it('should set cache headers', () => {
        const date = new Date();
        const event = new DispatchEvent(createTestRequest('/'));

        setResponseCacheHeaders(event, {
            maxAge: 3600,
            modifiedTime: date,
            cacheControls: [
                'must-revalidate',
            ],
        });

        expect(event.response.headers.get(HeaderName.CACHE_CONTROL))
            .toEqual('public, must-revalidate, max-age=3600, s-maxage=3600');
        expect(event.response.headers.get(HeaderName.LAST_MODIFIED))
            .toEqual(date.toUTCString());
    });
});
