import supertest from 'supertest';
import {
    Router,
    coreHandler,
    createNodeDispatcher,
    useRequestParams,
} from '../../../src';

describe('src/module', () => {
    it('should send hello world', async () => {
        const router = new Router();

        router.use(coreHandler(() => 'Hello, World!'));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('Hello, World!');
    });

    it('should process async & sync handler', async () => {
        const router = new Router();

        router.get(
            '/async',
            coreHandler(async () => new Promise((resolve) => {
                setTimeout(() => resolve('foo'), 0);
            })),
        );

        router.get('/sync', coreHandler(() => 'bar'));

        const server = supertest(createNodeDispatcher(router));

        let response = await server
            .get('/async');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('foo');

        response = await server
            .get('/sync');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    });

    it('should process dynamic path', async () => {
        const router = new Router();

        router.get('/param/:id', coreHandler(async (req) => {
            const params = useRequestParams(req);

            return params.id;
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/param/abc');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('abc');
    });

    it('should process with no matching route', async () => {
        const router = new Router();

        router.get(
            '/param/:id',
            coreHandler(() => 'foo'),
        );

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/foo');

        expect(response.statusCode).toEqual(404);
    });

    it('should process with error thrown', async () => {
        const router = new Router();

        router.get('/', coreHandler(() => {
            throw new Error('foo');
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(500);
    });

    it('should process with async error thrown', async () => {
        const router = new Router();

        router.get(coreHandler(() => async () => {
            await new Promise((_resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('bar'));
                }, 0);
            });
        }));

        const server = supertest(createNodeDispatcher(router));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(500);
    });
});
