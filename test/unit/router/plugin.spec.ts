import supertest from 'supertest';
import { Router, coreHandler, createNodeDispatcher } from '../../../src';
import type { Plugin } from '../../../src';

type Options = {
    handlerPath?: string
};

function plugin(options: Options = {}) : Plugin {
    return {
        name: '@routup/plugin',
        install: (router) => {
            router.get(options.handlerPath || '/', coreHandler(() => 'Hello, World!'));
        },
    };
}

describe('src/plugin/**', () => {
    it('should install plugin', async () => {
        const router = new Router();
        router.install(plugin());

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello, World!');
    });

    it('should install plugin with options', async () => {
        const router = new Router();
        router.install(plugin({ handlerPath: '/foo' }));

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
        router.use('/child', plugin());

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/child');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello, World!');

        response = await server
            .get('/');

        expect(response.statusCode).toEqual(404);
    });
});
