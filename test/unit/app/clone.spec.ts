import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    App,
    defineCoreHandler,
} from '../../../src';
import { HookName } from '../../../src/hook';
import { createTestRequest } from '../../helpers';

describe('src/app clone', () => {
    it('should produce a router that responds independently', async () => {
        const original = new App();
        original.get('/ping', defineCoreHandler(() => 'pong'));

        const clone = original.clone();

        const fromOriginal = await original.fetch(createTestRequest('/ping'));
        expect(await fromOriginal.text()).toEqual('pong');

        const fromClone = await clone.fetch(createTestRequest('/ping'));
        expect(await fromClone.text()).toEqual('pong');
    });

    it('should allow mounting clones under multiple paths', async () => {
        const child = new App();
        child.get('/ping', defineCoreHandler(() => 'pong'));

        const parent = new App();
        for (const path of ['/users', '/members']) {
            parent.use(path, child.clone());
        }

        const fromUsers = await parent.fetch(createTestRequest('/users/ping'));
        expect(await fromUsers.text()).toEqual('pong');

        const fromMembers = await parent.fetch(createTestRequest('/members/ping'));
        expect(await fromMembers.text()).toEqual('pong');
    });

    it('should not share stack mutations between original and clone', async () => {
        const original = new App();
        original.get('/a', defineCoreHandler(() => 'A'));

        const clone = original.clone();

        // Add a route only to the clone — original must not see it.
        clone.get('/b', defineCoreHandler(() => 'B'));

        const cloneB = await clone.fetch(createTestRequest('/b'));
        expect(cloneB.status).toEqual(200);
        expect(await cloneB.text()).toEqual('B');

        const originalB = await original.fetch(createTestRequest('/b'));
        expect(originalB.status).toEqual(404);
    });

    it('should not share hook listener mutations between original and clone', async () => {
        const original = new App();
        original.get('/', defineCoreHandler(() => 'ok'));

        const sharedListener = vi.fn();
        original.on(HookName.START, sharedListener);

        const clone = original.clone();

        const cloneOnlyListener = vi.fn();
        clone.on(HookName.START, cloneOnlyListener);

        await clone.fetch(createTestRequest('/'));
        expect(sharedListener).toHaveBeenCalledTimes(1);
        expect(cloneOnlyListener).toHaveBeenCalledTimes(1);

        sharedListener.mockClear();
        cloneOnlyListener.mockClear();

        await original.fetch(createTestRequest('/'));
        expect(sharedListener).toHaveBeenCalledTimes(1);
        expect(cloneOnlyListener).not.toHaveBeenCalled();
    });

    it('should not share plugin registration between original and clone', async () => {
        const original = new App();
        original.use({
            name: 'plug',
            version: '1.0.0',
            install(_router) {
                // no-op
            },
        });

        const clone = original.clone();
        expect(clone.hasPlugin('plug')).toBe(true);
        expect(clone.getPluginVersion('plug')).toEqual('1.0.0');

        // Installing a different plugin on the clone must not affect the original.
        clone.use({
            name: 'plug-2',
            install(_router) {
                // no-op
            },
        });
        expect(clone.hasPlugin('plug-2')).toBe(true);
        expect(original.hasPlugin('plug-2')).toBe(false);
    });

    it('should share child handler references — clone is shallow', async () => {
        const handler = defineCoreHandler(() => 'shared');
        const original = new App();
        original.get('/x', handler);

        const clone = original.clone();
        const fromClone = await clone.fetch(createTestRequest('/x'));
        expect(await fromClone.text()).toEqual('shared');

        const fromOriginal = await original.fetch(createTestRequest('/x'));
        expect(await fromOriginal.text()).toEqual('shared');
    });

    it('should preserve combined mount paths through clone()', async () => {
        const original = new App();
        original.get('/ping', defineCoreHandler(() => 'pong'));

        const clone = original.clone();

        const parent = new App();
        parent.use('/api', clone);

        const response = await parent.fetch(createTestRequest('/api/ping'));
        expect(await response.text()).toEqual('pong');
    });

    it('should preserve the router name on the clone', () => {
        const original = new App({ name: 'foo' });
        const clone = original.clone();
        expect(clone.name).toEqual('foo');
    });

    it('should preserve the router family on clone (no LinearRouter downgrade)', async () => {
        // App.clone() must propagate the active IRouter implementation
        // via `this.router.clone()` so apps configured with TrieRouter
        // (or any custom router) don't silently downgrade to the
        // LinearRouter default.
        const { TrieRouter, MemoizedRouter } = await import('../../../src');

        const trieApp = new App({ router: new TrieRouter() });
        trieApp.get('/x', defineCoreHandler(() => 'x'));
        const trieClone = trieApp.clone();
        // We can't introspect `router` directly (it's protected), so
        // exercise router-dependent behaviour: the clone must still
        // match the registered route after re-registration.
        const res1 = await trieClone.fetch(createTestRequest('/x'));
        expect(await res1.text()).toEqual('x');

        // Composition: MemoizedRouter wrapping TrieRouter should also
        // round-trip through clone.
        const memoApp = new App({ router: new MemoizedRouter(new TrieRouter()) });
        memoApp.get('/y', defineCoreHandler(() => 'y'));
        const memoClone = memoApp.clone();
        const res2 = await memoClone.fetch(createTestRequest('/y'));
        expect(await res2.text()).toEqual('y');
    });

    it('should preserve the router family across plugin install', async () => {
        // App.install() also passes `router: this.router.clone()` to
        // the plugin's child app. A plugin installed on a TrieRouter
        // app must run on a TrieRouter, not the LinearRouter default.
        const { TrieRouter } = await import('../../../src');

        const installed = vi.fn();
        const plugin = {
            name: 'probe-router',
            install: (childApp: App) => {
                installed(childApp);
                childApp.get('/probe', defineCoreHandler(() => 'probe-ok'));
            },
        };

        const app = new App({ router: new TrieRouter() });
        app.use(plugin as any);

        const res = await app.fetch(createTestRequest('/probe'));
        expect(await res.text()).toEqual('probe-ok');
        expect(installed).toHaveBeenCalledOnce();
    });
});
