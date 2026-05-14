import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler } from '../../../src';
import type { Plugin } from '../../../src';
import { createTestRequest } from '../../helpers';

type Options = {
    handlerPath?: string
};

function plugin(options: Options = {}) : Plugin {
    return {
        name: '@routup/plugin',
        install: (router) => {
            router.get(options.handlerPath || '/', defineCoreHandler(() => 'Hello, World!'));
        },
    };
}

describe('src/plugin/**', () => {
    it('should install plugin', async () => {
        const router = new App();
        router.use(plugin());

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('Hello, World!');
    });

    it('should install plugin with same name', async () => {
        const router = new App();
        router.use({
            name: 'plugin',
            install: () => {
                router.get('/', defineCoreHandler((event) => event.next()));
            },
        });
        router.use({
            name: 'plugin',
            install: (router) => {
                router.get('/', defineCoreHandler(() => 'Hello, World!'));
            },
        });

        const response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('Hello, World!');
    });

    it('should install plugin with options', async () => {
        const router = new App();
        router.use(plugin({ handlerPath: '/foo' }));

        let response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(404);

        response = await router.fetch(createTestRequest('/foo'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('Hello, World!');
    });

    it('should install plugin as child router', async () => {
        const router = new App();
        router.use('/child', plugin());

        let response = await router.fetch(createTestRequest('/child'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('Hello, World!');

        response = await router.fetch(createTestRequest('/'));

        expect(response.status).toEqual(404);
    });
});
