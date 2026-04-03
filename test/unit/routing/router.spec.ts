import { describe, expect, it } from 'vitest';
import {
    Router,
    coreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/module', () => {
    it('should send hello world', async () => {
        const router = new Router();

        router.use(coreHandler(() => 'Hello, World!'));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('Hello, World!');
    });

    it('should process async & sync handler', async () => {
        const router = new Router();

        router.get(
            '/async',
            coreHandler(async () => new Promise((resolve) => {
                setTimeout(() => resolve('foo'), 0);
            })),
        );

        router.get('/sync', coreHandler(() => 'bar'));

        let response = await router.fetch(createTestRequest('/async'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('foo');

        response = await router.fetch(createTestRequest('/sync'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('bar');
    });

    it('should process dynamic path', async () => {
        const router = new Router();

        router.get('/param/:id', coreHandler(async (event) => event.params.id));

        const response = await router.fetch(createTestRequest('/param/abc'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('abc');
    });

    it('should process with no matching route', async () => {
        const router = new Router();

        router.get(
            '/param/:id',
            coreHandler(() => 'foo'),
        );

        const response = await router.fetch(createTestRequest('/foo'));

        expect(response.status).toEqual(404);
    });

    it('should process with error thrown', async () => {
        const router = new Router();

        router.get('/', coreHandler(() => {
            throw new Error('foo');
        }));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(500);
    });

    it('should process with async error thrown', async () => {
        const router = new Router();

        router.get('/', coreHandler(async () => {
            await new Promise((_resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('bar'));
                }, 0);
            });
        }));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(500);
    });
});
