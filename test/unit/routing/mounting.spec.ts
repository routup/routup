import { describe, expect, it } from 'vitest';
import {
    App,
    defineCoreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/router mounting', () => {
    it('should not mutate the user-held child router\'s mount path', async () => {
        const child = new App();
        child.get('/ping', defineCoreHandler(() => 'pong'));

        const parent = new App();
        parent.use('/api', child);

        // The mount path lives on the parent's stack entry, not on the child.
        // Mounting the child elsewhere later should not be affected by the
        // first mount.
        const otherParent = new App();
        otherParent.use('/v2', child);

        const fromApi = await parent.fetch(createTestRequest('/api/ping'));
        expect(await fromApi.text()).toEqual('pong');

        const fromV2 = await otherParent.fetch(createTestRequest('/v2/ping'));
        expect(await fromV2.text()).toEqual('pong');
    });

    it('should allow mounting the same router twice on the same parent at different paths', async () => {
        const child = new App();
        child.get('/ping', defineCoreHandler(() => 'pong'));

        const parent = new App();
        parent.use('/a', child);
        parent.use('/b', child);

        const fromA = await parent.fetch(createTestRequest('/a/ping'));
        expect(await fromA.text()).toEqual('pong');

        const fromB = await parent.fetch(createTestRequest('/b/ping'));
        expect(await fromB.text()).toEqual('pong');
    });

    it('should mount a child router under a path prefix supplied to use()', async () => {
        const child = new App();
        child.get('/ping', defineCoreHandler(() => 'pong'));

        const parent = new App();
        parent.use('/api', child);

        const response = await parent.fetch(createTestRequest('/api/ping'));
        expect(await response.text()).toEqual('pong');
    });

    it('should not mutate a handler\'s method when registered via a method shortcut', async () => {
        const handler = defineCoreHandler(() => 'ok');
        const before = handler.method;

        const router = new App();
        router.get('/foo', handler);

        // Method bound on the entry, not on the handler itself.
        expect(handler.method).toEqual(before);

        const response = await router.fetch(createTestRequest('/foo'));
        expect(await response.text()).toEqual('ok');
    });

    it('should let the parent continue when a child router\'s tail handler calls next()', async () => {
        const child = new App();
        child.use(defineCoreHandler((event) => event.next()));

        const parent = new App();
        parent.use('/api', child);
        parent.get('/api/foo', defineCoreHandler(() => 'after-child'));

        const response = await parent.fetch(createTestRequest('/api/foo'));
        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('after-child');
    });

    it('should let the parent continue when a path-prefixed child router yields no response', async () => {
        const child = new App();
        child.use(defineCoreHandler((event) => event.next()));

        const parent = new App();
        parent.use('/api', child);
        parent.get('/api/foo', defineCoreHandler(() => 'after-child'));

        const response = await parent.fetch(createTestRequest('/api/foo'));
        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('after-child');
    });
});
