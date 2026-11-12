import { describe, expect, it } from 'vitest';
import {
    App,
    HeaderName,
    defineCoreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('routing/methods', () => {
    it('should handle different methods', async () => {
        const router = new App();

        router.delete('/delete', defineCoreHandler(async () => 'delete'));
        router.get('/get', defineCoreHandler(async () => 'get'));
        router.patch('/patch', defineCoreHandler(async () => 'patch'));
        router.post('/post', defineCoreHandler(async () => 'post'));
        router.put('/put', defineCoreHandler(async () => 'put'));
        router.head('/head', defineCoreHandler(async () => ''));
        router.options('/options', defineCoreHandler(async () => 'options'));

        let response = await router.fetch(createTestRequest('/delete', { method: 'DELETE' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('delete');

        response = await router.fetch(createTestRequest('/get'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('get');

        response = await router.fetch(createTestRequest('/patch', { method: 'PATCH' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('patch');

        response = await router.fetch(createTestRequest('/post', { method: 'POST' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('post');

        response = await router.fetch(createTestRequest('/put', { method: 'PUT' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('put');

        response = await router.fetch(createTestRequest('/head', { method: 'HEAD' }));

        expect(response.status).toEqual(200);

        response = await router.fetch(createTestRequest('/options', { method: 'OPTIONS' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('options');
    });

    it('should define global head handler', async () => {
        const router = new App();

        router.head(defineCoreHandler(async () => 'HEAD'));

        const response = await router.fetch(createTestRequest('/', { method: 'HEAD' }));

        expect(response.status).toEqual(200);
    });

    it('should define global options handler', async () => {
        const router = new App();

        router.options(defineCoreHandler(async () => 'options'));

        const response = await router.fetch(createTestRequest('/', { method: 'OPTIONS' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('options');
    });

    it('should handle different methods on same path', async () => {
        const router = new App();

        router.delete(defineCoreHandler(async () => 'delete'));
        router.get(defineCoreHandler(async () => 'get'));
        router.patch(defineCoreHandler(async () => 'patch'));
        router.post(defineCoreHandler(async () => 'post'));
        router.put(defineCoreHandler(async () => 'put'));

        let response = await router.fetch(createTestRequest('/', { method: 'DELETE' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('delete');

        response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('get');

        response = await router.fetch(createTestRequest('/', { method: 'PATCH' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('patch');

        response = await router.fetch(createTestRequest('/', { method: 'POST' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('post');

        response = await router.fetch(createTestRequest('/', { method: 'PUT' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('put');

        response = await router.fetch(createTestRequest('/', { method: 'HEAD' }));

        expect(response.status).toEqual(200);

        response = await router.fetch(createTestRequest('/', { method: 'OPTIONS' }));

        expect(response.status).toEqual(200);
        expect(response.headers.get(HeaderName.ALLOW)).toEqual('DELETE,GET,PATCH,POST,PUT,HEAD');
        expect(await response.text()).toEqual('DELETE,GET,PATCH,POST,PUT,HEAD');
    });

    it('should fail the synthesized Allow response when a middleware set a null-body status', async () => {
        const router = new App();

        router.use(defineCoreHandler((event) => {
            event.response.status = 204;

            return event.next();
        }));
        router.get('/', defineCoreHandler(() => 'get'));

        const response = await router.fetch(createTestRequest('/', {
            method: 'OPTIONS',
            headers: { accept: 'application/json' },
        }));

        // The Allow body is not allowed with 204: the platform error
        // escapes dispatch and becomes the 500 fallback.
        expect(response.status).toEqual(500);
        expect(response.headers.has(HeaderName.ALLOW)).toBe(false);

        const body = await response.json();

        expect(body.status).toEqual(500);
        expect(body.message).toMatch(/204/);
    });
});
