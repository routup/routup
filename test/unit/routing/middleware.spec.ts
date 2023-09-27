import supertest from 'supertest';
import {
    Router,
    coreHandler,
    createNodeDispatcher,
    errorHandler,
    send, setRequestEnv, useRequestEnv,
} from '../../../src';

describe('routing/middleware', () => {
    it('should use middleware', async () => {
        const router = new Router();

        router.use(coreHandler((req, _res, next) => {
            setRequestEnv(req, 'foo', 'bar');

            next();
        }));

        router.get(coreHandler((req, res) => {
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

        router.get(coreHandler(() => {
            throw new Error('ero');
        }));

        router.use(errorHandler((err, _req, res) => {
            send(res, err.message);
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('ero');
    });

    it('should use middleware on specific path', async () => {
        const router = new Router();

        router.use('/foo', coreHandler((req, _res, next) => {
            setRequestEnv(req, 'foo', 'bar');

            next();
        }));

        router.get('/', coreHandler((req, res) => {
            send(res, useRequestEnv(req, 'foo'));
        }));

        router.get('/foo', coreHandler((req, res) => {
            send(res, useRequestEnv(req, 'foo'));
        }));

        router.use('/bar', coreHandler((req, _res, next) => {
            setRequestEnv(req, 'bar', 'baz');
            next();
        }));

        router.get(
            '/bar',
            coreHandler((req, res) => {
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
