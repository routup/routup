import { describe, expect, it } from 'vitest';
import {
    Router,
    coreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/router', () => {
    it('should not send etag when disabled', async () => {
        const router = new Router({ etag: false });

        router.get('/', coreHandler(() => 'Hello world!'));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.headers.get('etag')).toBeNull();
        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('Hello world!');
    });
});
