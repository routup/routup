import { describe, expect, it } from 'vitest';
import {
    PluginAlreadyInstalledError,
    Router,
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

describe('src/plugin install', () => {
    it('should run a plugin\'s install function and serve its handlers', async () => {
        const router = new Router();
        router.use(cookiePlugin());

        const response = await router.fetch(createTestRequest('/'));
        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('cookie');
    });

    it('should track an installed plugin via hasPlugin', () => {
        const router = new Router();

        expect(router.hasPlugin('@routup/cookie')).toBe(false);

        router.use(cookiePlugin());

        expect(router.hasPlugin('@routup/cookie')).toBe(true);
    });

    it('should track plugin version via getPluginVersion', () => {
        const router = new Router();
        router.use(cookiePlugin('3.2.1'));

        expect(router.getPluginVersion('@routup/cookie')).toBe('3.2.1');
    });

    it('should throw when installing the same plugin twice on the same router', () => {
        const router = new Router();
        router.use(cookiePlugin());

        expect(() => router.use(cookiePlugin())).toThrowError(PluginAlreadyInstalledError);
    });

    it('should allow installing the same plugin on a child router when the parent already has it', () => {
        const parent = new Router();
        parent.use(cookiePlugin('1.0.0'));

        const child = new Router();
        parent.use(child);

        expect(() => child.use(cookiePlugin('1.0.0'))).not.toThrow();
    });

    it('should mount a plugin at a path when one is provided', async () => {
        const router = new Router();
        router.use('/api', cookiePlugin());

        const matched = await router.fetch(createTestRequest('/api/'));
        expect(await matched.text()).toEqual('cookie');

        const unmatched = await router.fetch(createTestRequest('/'));
        expect(unmatched.status).toEqual(404);
    });
});
