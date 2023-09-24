import supertest from 'supertest';
import {
    Router,
    createNodeDispatcher,
    defineContextHandler,
    defineErrorContextHandler,
    defineHandler,
    send,
    setRequestEnv, useRequestEnv,
} from '../../../src';

describe('routing/middleware', () => {
    it('should use middleware', async () => {
        const router = new Router();

        router.use(defineContextHandler((context) => {
            setRequestEnv(context.request, 'foo', 'bar');

            context.next();
        }));

        router.get('/', defineHandler((req, res) => {
            send(res, useRequestEnv(req, 'foo'));
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });

    it('should use error middleware', async () => {
        const router = new Router();

        router.get('/', () => {
            throw new Error('ero');
        });

        router.use(defineErrorContextHandler((context) => {
            send(context.response, context.error.message);
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('ero');
    });

    it('should use middleware on specific path', async () => {
        const router = new Router();

        router.use('/foo', defineContextHandler((context) => {
            setRequestEnv(context.request, 'foo', 'bar');

            context.next();
        }));

        router.get('/', defineHandler((req, res) => {
            send(res, useRequestEnv(req, 'foo'));
        }));

        router.get('/foo', defineHandler((req, res) => {
            send(res, useRequestEnv(req, 'foo'));
        }));

        router.use('/bar', defineHandler((req, _res, next) => {
            setRequestEnv(req, 'bar', 'baz');
            next();
        }));

        router.get(
            '/bar',
            defineHandler((req, res) => {
                send(res, useRequestEnv(req, 'bar'));
            }),
        );

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toBeFalsy();

        response = await server
            .get('/foo');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');

        response = await server
            .get('/bar');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('baz');
    });
});
