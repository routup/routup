import { describe, expect, it } from 'vitest';
import {
    HeaderName,
    Router,
    defineCoreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('routing/methods', () => {
    it('should handle different methods', async () => {
        const router = new Router();

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
        const router = new Router();
        router.head(defineCoreHandler(async () => 'HEAD'));

        const response = await router.fetch(createTestRequest('/', { method: 'HEAD' }));

        expect(response.status).toEqual(200);
    });

    it('should define global options handler', async () => {
        const router = new Router();
        router.options(defineCoreHandler(async () => 'options'));

        const response = await router.fetch(createTestRequest('/', { method: 'OPTIONS' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('options');
    });

    it('should handle different methods on same path', async () => {
        const router = new Router();

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
});
