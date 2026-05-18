import { describe, expect, it } from 'vitest';
import {
    App,
    defineCoreHandler,
} from '../../../src';
import type { Plugin } from '../../../src';
import { createTestRequest } from '../../helpers';

function cookiePlugin(version?: string): Plugin {
    return {
        name: '@routup/cookie',
        version,
        install: (router) => {
            router.get('/', defineCoreHandler(() => 'cookie'));
        },
    };
}

function singletonPlugin(): Plugin {
    return {
        name: '@routup/cors',
        singleton: true,
        install: (router) => {
            router.get('/', defineCoreHandler(() => 'cors'));
        },
    };
}

function singletonByPathPlugin(): Plugin {
    return {
        name: '@routup/rate-limit',
        singletonByPath: true,
        install: (router) => {
            router.get('/', defineCoreHandler(() => 'rate-limit'));
        },
    };
}

function assetsPlugin(label: string): Plugin {
    return {
        name: '@routup/assets',
        install: (router) => {
            router.get('/file', defineCoreHandler(() => label));
        },
    };
}

// Count how many distinct route entries this App carries — the silent-
// skip path returns without registering, so the count is the cleanest
// observational signal that a second install was actually dropped.
function routeCount(app: App): number {
    return (app as unknown as { _routes: unknown[] })._routes.length;
}

describe('src/plugin install', () => {
    it('should run a plugin\'s install function and serve its handlers', async () => {
        const router = new App();
        router.use(cookiePlugin());

        const response = await router.fetch(createTestRequest('/'));
        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('cookie');
    });

    it('should track an installed plugin via hasPlugin', () => {
        const router = new App();

        expect(router.hasPlugin('@routup/cookie')).toBe(false);

        router.use(cookiePlugin());

        expect(router.hasPlugin('@routup/cookie')).toBe(true);
    });

    it('should track plugin version via getPluginVersion', () => {
        const router = new App();
        router.use(cookiePlugin('3.2.1'));

        expect(router.getPluginVersion('@routup/cookie')).toBe('3.2.1');
    });

    it('install is permissive by default — same plugin at the same path appends', () => {
        const router = new App();
        const before = routeCount(router);
        router.use(cookiePlugin('1.0.0'));
        const after1 = routeCount(router);

        router.use(cookiePlugin('1.0.1'));
        const after2 = routeCount(router);

        // No flag → both installs ran; the second registered its route again.
        // Compare deltas so the assertion survives any future change that
        // gives `new App()` a non-zero baseline (e.g. built-in middleware).
        const firstDelta = after1 - before;
        const secondDelta = after2 - after1;
        expect(firstDelta).toBeGreaterThan(0);
        expect(secondDelta).toBe(firstDelta);
        expect(router.hasPlugin('@routup/cookie')).toBe(true);
        // Version reflects the latest write at this mount key.
        expect(router.getPluginVersion('@routup/cookie')).toBe('1.0.1');
    });

    it('should allow installing the same plugin on a child router when the parent already has it', () => {
        const parent = new App();
        parent.use(cookiePlugin('1.0.0'));

        const child = new App();
        parent.use(child);

        expect(() => child.use(cookiePlugin('1.0.0'))).not.toThrow();
    });

    it('should mount a plugin at a path when one is provided', async () => {
        const router = new App();
        router.use('/api', cookiePlugin());

        const matched = await router.fetch(createTestRequest('/api/'));
        expect(await matched.text()).toEqual('cookie');

        const unmatched = await router.fetch(createTestRequest('/'));
        expect(unmatched.status).toEqual(404);
    });

    it('should allow installing a non-singleton plugin at distinct mount paths', async () => {
        const router = new App();
        router.use('/v1', assetsPlugin('v1'));
        router.use('/v2', assetsPlugin('v2'));

        const v1 = await router.fetch(createTestRequest('/v1/file'));
        expect(await v1.text()).toEqual('v1');

        const v2 = await router.fetch(createTestRequest('/v2/file'));
        expect(await v2.text()).toEqual('v2');

        expect(router.hasPlugin('@routup/assets')).toBe(true);
        expect(router.hasPluginAt('@routup/assets', '/v1')).toBe(true);
        expect(router.hasPluginAt('@routup/assets', '/v2')).toBe(true);
        expect(router.hasPluginAt('@routup/assets', '/v3')).toBe(false);
        expect(router.getPluginMountPaths('@routup/assets')).toEqual(['/v1', '/v2']);
    });

    it('singletonByPath silently skips a second install at the same path', () => {
        const router = new App();
        router.use('/api', singletonByPathPlugin());
        const after1 = routeCount(router);

        router.use('/api', singletonByPathPlugin());
        const after2 = routeCount(router);

        // Second install no-ops — route count stays the same.
        expect(after2).toBe(after1);
        expect(router.hasPluginAt('@routup/rate-limit', '/api')).toBe(true);
    });

    it('singletonByPath still allows installs at distinct paths', () => {
        const router = new App();
        router.use('/api', singletonByPathPlugin());
        router.use('/admin', singletonByPathPlugin());

        expect(router.getPluginMountPaths('@routup/rate-limit')).toEqual(['/api', '/admin']);
    });

    it('singleton silently skips any second install, even at a different path', () => {
        const router = new App();
        router.use(singletonPlugin());
        const after1 = routeCount(router);

        router.use('/elsewhere', singletonPlugin());
        const after2 = routeCount(router);

        // Second install no-ops despite the different path.
        expect(after2).toBe(after1);
        expect(router.getPluginMountPaths('@routup/cors')).toEqual(['/']);
    });

    it('singleton claim is not promoted retroactively — first install wins', () => {
        // First install is non-flag, so no claim is recorded. A later
        // `singleton: true` install silently no-ops, but the claim still
        // isn't set — a third non-flag install at yet another path
        // succeeds.
        const router = new App();
        router.use('/v1', assetsPlugin('v1'));
        router.use('/v2', { ...assetsPlugin('v2'), singleton: true });
        router.use('/v3', assetsPlugin('v3'));

        expect(router.getPluginMountPaths('@routup/assets')).toEqual(['/v1', '/v3']);
    });

    it('hasPluginAt resolves paths relative to the App._path', () => {
        const api = new App({ path: '/api' });
        api.use(cookiePlugin());

        expect(api.hasPluginAt('@routup/cookie')).toBe(true);
        expect(api.getPluginMountPaths('@routup/cookie')).toEqual(['/api']);
    });

    it('getPluginVersionAt returns the version of a specific mount', () => {
        const router = new App();
        router.use('/v1', { ...assetsPlugin('v1'), version: '1.0.0' });
        router.use('/v2', { ...assetsPlugin('v2'), version: '2.0.0' });

        expect(router.getPluginVersionAt('@routup/assets', '/v1')).toBe('1.0.0');
        expect(router.getPluginVersionAt('@routup/assets', '/v2')).toBe('2.0.0');
        expect(router.getPluginVersionAt('@routup/assets', '/v3')).toBeUndefined();
        expect(router.getPluginVersionAt('@routup/unknown', '/v1')).toBeUndefined();
    });

    it('flatten composes child plugin mount paths through the parent prefix', () => {
        const child = new App();
        child.use('/inner', assetsPlugin('inner'));

        const parent = new App();
        parent.use('/api', child);

        expect(parent.hasPlugin('@routup/assets')).toBe(true);
        expect(parent.hasPluginAt('@routup/assets', '/api/inner')).toBe(true);
        expect(parent.getPluginMountPaths('@routup/assets')).toEqual(['/api/inner']);
    });

    it('flatten propagates a child singleton claim to the parent', () => {
        const child = new App();
        child.use(singletonPlugin());

        const parent = new App();
        parent.use('/api', child);

        expect(parent.hasPlugin('@routup/cors')).toBe(true);

        // A subsequent install of the same name on the parent is silently
        // dropped because the claim survived the mount.
        const before = routeCount(parent);
        parent.use(singletonPlugin());
        expect(routeCount(parent)).toBe(before);
    });

    it('flatten silently drops child entries when the parent already singleton-claimed the name', () => {
        // Parent claims the name first. Mounting a child whose plugin
        // shares the name no longer registers a new registry entry for
        // it (sticky claim blocks the merge). Routes still propagate —
        // sticky claim is forward-looking on the registry only.
        const parent = new App();
        parent.use(singletonPlugin());

        const child = new App();
        child.use('/inner', {
            ...singletonPlugin(),
            singleton: false,
        });

        const beforeMerge = parent.getPluginMountPaths('@routup/cors').slice();
        parent.use('/api', child);

        expect(parent.getPluginMountPaths('@routup/cors')).toEqual(beforeMerge);
    });
});
