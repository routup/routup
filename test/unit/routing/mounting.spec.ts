import { describe, expect, it } from 'vitest';
import {
    Router,
    defineCoreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/router mounting', () => {
    it('should not mutate the user-held child router\'s mount path', async () => {
        const child = new Router();
        child.get('/ping', defineCoreHandler(() => 'pong'));

        const parent = new Router();
        parent.use('/api', child);

        // The mount path lives on the parent's stack entry, not on the child.
        // Mounting the child elsewhere later should not be affected by the
        // first mount.
        const otherParent = new Router();
        otherParent.use('/v2', child);

        const fromApi = await parent.fetch(createTestRequest('/api/ping'));
        expect(await fromApi.text()).toEqual('pong');

        const fromV2 = await otherParent.fetch(createTestRequest('/v2/ping'));
        expect(await fromV2.text()).toEqual('pong');
    });

    it('should allow mounting the same router twice on the same parent at different paths', async () => {
        const child = new Router();
        child.get('/ping', defineCoreHandler(() => 'pong'));

        const parent = new Router();
        parent.use('/a', child);
        parent.use('/b', child);

        const fromA = await parent.fetch(createTestRequest('/a/ping'));
        expect(await fromA.text()).toEqual('pong');

        const fromB = await parent.fetch(createTestRequest('/b/ping'));
        expect(await fromB.text()).toEqual('pong');
    });

    it('should fall back to the router\'s own intrinsic path when no mount path is given', async () => {
        const child = new Router({ path: '/api' });
        child.get('/ping', defineCoreHandler(() => 'pong'));

        const parent = new Router();
        parent.use(child);

        const response = await parent.fetch(createTestRequest('/api/ping'));
        expect(await response.text()).toEqual('pong');
    });

    it('should not mutate a handler\'s method when registered via a method shortcut', async () => {
        const handler = defineCoreHandler(() => 'ok');
        const before = handler.method;

        const router = new Router();
        router.get('/foo', handler);

        // Method bound on the entry, not on the handler itself.
        expect(handler.method).toEqual(before);

        const response = await router.fetch(createTestRequest('/foo'));
        expect(await response.text()).toEqual('ok');
    });
});
