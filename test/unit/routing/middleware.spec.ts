import { describe, expect, it } from 'vitest';
import {
    Router,
    coreHandler,
    errorHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('routing/middleware', () => {
    it('should use middleware', async () => {
        const router = new Router();

        router.use(coreHandler((event) => {
            event.foo = 'bar';

            return event.next();
        }));

        router.get(coreHandler((event) => event.foo));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('bar');
    });

    it('should use error middleware', async () => {
        const router = new Router();

        router.get(coreHandler(() => {
            throw new Error('ero');
        }));

        router.use(errorHandler((error) => error.message));

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('ero');
    });

    it('should use middleware on specific path', async () => {
        const router = new Router();

        router.use('/foo', coreHandler((event) => {
            event.foo = 'bar';

            return event.next();
        }));

        router.get('/', coreHandler((event) => event.foo || ''));

        router.get('/foo', coreHandler((event) => event.foo));

        router.use('/bar', coreHandler((event) => {
            event.bar = 'baz';
            return event.next();
        }));

        router.get(
            '/bar',
            coreHandler((event) => event.bar),
        );

        let response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toBeFalsy();

        response = await router.fetch(createTestRequest('/foo'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('bar');

        response = await router.fetch(createTestRequest('/bar'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('baz');
    });
});
