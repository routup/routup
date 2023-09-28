import supertest from 'supertest';
import { Router, coreHandler, createNodeDispatcher } from '../../../src';
import type { Plugin } from '../../../src';

type Options = {
    handlerPath?: string
};

const plugin : Plugin<Options> = {
    name: '@routup/plugin',
    install: (router, options) => {
        router.get(options.handlerPath || '/', coreHandler(() => 'Hello, World!'));
    },
};

describe('src/plugin/**', () => {
    it('should install plugin', async () => {
        const router = new Router();
        router.install(plugin, {});

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello, World!');
    });

    it('should install plugin with options', async () => {
        const router = new Router();
        router.install(plugin, { handlerPath: '/foo' });

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(404);

        response = await server
            .get('/foo');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello, World!');
    });

    it('should install plugin as child router', async () => {
        const router = new Router();
        router.install(plugin, { path: '/child', options: {} });

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/child');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello, World!');

        response = await server
            .get('/');

        expect(response.statusCode).toEqual(404);
    });

    it('should install & uninstall plugin', async () => {
        const router = new Router();
        router.install(plugin, { path: '/', options: {} });
        router.uninstall(plugin.name);

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');
        expect(response.statusCode).toEqual(404);
    });
});
