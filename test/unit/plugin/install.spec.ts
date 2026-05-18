import { describe, expect, it } from 'vitest';
import {
    App,
    PluginAlreadyInstalledError,
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

function assetsPlugin(label: string): Plugin {
    return {
        name: '@routup/assets',
        install: (router) => {
            router.get('/file', defineCoreHandler(() => label));
        },
    };
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

    it('should throw when installing the same plugin twice at the same path', () => {
        const router = new App();
        router.use(cookiePlugin());

        expect(() => router.use(cookiePlugin())).toThrowError(PluginAlreadyInstalledError);
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

    it('should still reject the same non-singleton plugin twice at the same path', () => {
        const router = new App();
        router.use('/v1', assetsPlugin('v1'));

        expect(() => router.use('/v1', assetsPlugin('v1-again'))).toThrowError(PluginAlreadyInstalledError);
    });

    it('should reject any second install of a singleton plugin, even at a different path', () => {
        const router = new App();
        router.use(singletonPlugin());

        expect(() => router.use('/elsewhere', singletonPlugin())).toThrowError(PluginAlreadyInstalledError);
    });

    it('should reject promoting an already-mounted plugin to singleton', () => {
        const router = new App();
        router.use('/v1', assetsPlugin('v1'));

        expect(() => router.use('/v2', {
            ...assetsPlugin('v2'),
            singleton: true,
        })).toThrowError(PluginAlreadyInstalledError);
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
        expect(() => parent.use(singletonPlugin())).toThrowError(PluginAlreadyInstalledError);
    });

    it('flatten rejects mounting a child whose singleton plugin name is already mounted on the parent', () => {
        const child = new App();
        child.use(singletonPlugin());

        const parent = new App();
        parent.use('/elsewhere', {
            ...singletonPlugin(),
            singleton: false,
        });

        expect(() => parent.use('/api', child)).toThrowError(PluginAlreadyInstalledError);
    });

    it('flatten rejects mounting a child whose plugin name was already singleton-claimed on the parent', () => {
        // Parent claims a name as singleton up front; even a *non*-
        // singleton child install of the same name must be rejected at
        // mount time. Covers the other direction of the singleton-vs-
        // multi-mount conflict from the test above.
        const parent = new App();
        parent.use(singletonPlugin());

        const child = new App();
        child.use('/inner', {
            ...singletonPlugin(),
            singleton: false,
        });

        expect(() => parent.use('/api', child)).toThrowError(PluginAlreadyInstalledError);
    });
});
