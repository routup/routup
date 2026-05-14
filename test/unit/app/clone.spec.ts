import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    App,
    LinearRouter,
    defineCoreHandler,
} from '../../../src';
import type { IRouter, RouterMatch } from '../../../src';
import type { StackEntry } from '../../../src/app/types';
import { HookName } from '../../../src/hook';
import { createTestRequest } from '../../helpers';

/**
 * Branded test double — wraps a LinearRouter and tracks how many
 * times `clone()` was called. Used to prove `App.clone()` and
 * `App.install()` route through the *active* router's `clone()`
 * rather than instantiating a fresh LinearRouter directly.
 */
class BrandedRouter implements IRouter {
    static readonly brand = Symbol('BrandedRouter');

    static clones = 0;

    protected inner = new LinearRouter();

    add(entry: StackEntry): void {
        this.inner.add(entry);
    }

    lookup(path: string): readonly RouterMatch[] {
        return this.inner.lookup(path);
    }

    get entries(): readonly StackEntry[] {
        return this.inner.entries;
    }

    clone(): IRouter {
        BrandedRouter.clones += 1;
        return new BrandedRouter();
    }
}

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

    it('App.clone() routes through the active router\'s clone() (no LinearRouter downgrade)', async () => {
        // A test double that counts clone() calls — proves the cloned
        // App's router was constructed via the parent's `IRouter.clone()`
        // and not freshly instantiated as a default LinearRouter.
        BrandedRouter.clones = 0;

        const app = new App({ router: new BrandedRouter() });
        app.get('/x', defineCoreHandler(() => 'x'));

        const clone = app.clone();

        expect(BrandedRouter.clones).toBe(1);
        // Sanity: clone still routes through the branded router.
        const res = await clone.fetch(createTestRequest('/x'));
        expect(await res.text()).toEqual('x');
    });

    it('App.install() routes through the active router\'s clone() (no LinearRouter downgrade)', async () => {
        // Same regression as above, but for the plugin install path —
        // the plugin's child sub-app's router must come from the parent's
        // `IRouter.clone()`, not from constructing a fresh LinearRouter.
        BrandedRouter.clones = 0;

        const installed = vi.fn();
        const plugin = {
            name: 'probe-branded',
            install: (childApp: App) => {
                installed(childApp);
                childApp.get('/probe', defineCoreHandler(() => 'probe-ok'));
            },
        };

        const app = new App({ router: new BrandedRouter() });
        app.use(plugin as any);

        // install() consumes one clone for the plugin's child sub-app.
        expect(BrandedRouter.clones).toBe(1);
        expect(installed).toHaveBeenCalledOnce();

        // Sanity: the registered route still resolves.
        const res = await app.fetch(createTestRequest('/probe'));
        expect(await res.text()).toEqual('probe-ok');
    });
});
