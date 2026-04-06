import { describe, expect, it } from 'vitest';
import {
    Router,
    defineCoreHandler,
    defineErrorHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('routing/middleware', () => {
    it('should use middleware', async () => {
        const router = new Router();

        router.use(defineCoreHandler((event) => {
            event.store.foo = 'bar';

            return event.next();
        }));

        router.get(defineCoreHandler((event) => event.store.foo));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('bar');
    });

    it('should use error middleware', async () => {
        const router = new Router();

        router.get(defineCoreHandler(() => {
            throw new Error('ero');
        }));

        router.use(defineErrorHandler((error) => error.message));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('ero');
    });

    it('should use middleware on specific path', async () => {
        const router = new Router();

        router.use('/foo', defineCoreHandler((event) => {
            event.store.foo = 'bar';

            return event.next();
        }));

        router.get('/', defineCoreHandler((event) => (event.store.foo as string) || ''));

        router.get('/foo', defineCoreHandler((event) => event.store.foo));

        router.use('/bar', defineCoreHandler((event) => {
            event.store.bar = 'baz';
            return event.next();
        }));

        router.get(
            '/bar',
            defineCoreHandler((event) => event.store.bar),
        );

        let response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('');

        response = await router.fetch(createTestRequest('/foo'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('bar');

        response = await router.fetch(createTestRequest('/bar'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('baz');
    });
});
