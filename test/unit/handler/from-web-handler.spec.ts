import { describe, expect, it } from 'vitest';
import {
    Router,
    defineCoreHandler,
    fromWebHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/handler/adapters/web', () => {
    it('should mount a plain fetch function', async () => {
        const router = new Router();

        router.use('/api', fromWebHandler((req: Request) => new Response(new URL(req.url).pathname)));

        const response = await router.fetch(createTestRequest('/api/users'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/api/users');
    });

    it('should mount an object with a fetch method', async () => {
        const app = {
            fetch(req: Request) {
                return new Response(`fetched:${new URL(req.url).pathname}`);
            },
        };

        const router = new Router();
        router.use('/app', fromWebHandler(app));

        const response = await router.fetch(createTestRequest('/app/hello'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('fetched:/app/hello');
    });

    it('should pass original request URL', async () => {
        const router = new Router();

        router.use('/api/v1', fromWebHandler((req: Request) => new Response(req.url)));

        const response = await router.fetch(createTestRequest('/api/v1/users/42'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('http://localhost/api/v1/users/42');
    });

    it('should preserve request method', async () => {
        const router = new Router();

        router.use('/api', fromWebHandler((req: Request) => new Response(req.method)));

        const response = await router.fetch(createTestRequest('/api/items', { method: 'POST' }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('POST');
    });

    it('should preserve request headers', async () => {
        const router = new Router();

        router.use('/api', fromWebHandler((req: Request) => new Response(req.headers.get('x-custom') || '')));

        const response = await router.fetch(createTestRequest('/api/test', { headers: { 'x-custom': 'my-value' } }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('my-value');
    });

    it('should preserve request body', async () => {
        const router = new Router();

        router.use('/api', fromWebHandler(async (req: Request) => {
            const body = await req.text();
            return new Response(body);
        }));

        const response = await router.fetch(createTestRequest('/api/echo', {
            method: 'POST',
            body: 'hello world',
        }));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('hello world');
    });

    it('should work without mount path', async () => {
        const router = new Router();

        router.use(fromWebHandler((req: Request) => new Response(new URL(req.url).pathname)));

        const response = await router.fetch(createTestRequest('/foo/bar'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('/foo/bar');
    });

    it('should work alongside regular handlers', async () => {
        const router = new Router();

        router.get('/native', defineCoreHandler(() => 'native'));
        router.use('/external', fromWebHandler(() => new Response('external')));

        let response = await router.fetch(createTestRequest('/native'));
        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('native');

        response = await router.fetch(createTestRequest('/external/test'));
        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('external');
    });

    it('should preserve query string', async () => {
        const router = new Router();

        router.use('/api', fromWebHandler((req: Request) => {
            const url = new URL(req.url);
            return new Response(url.search);
        }));

        const response = await router.fetch(createTestRequest('/api/search?q=hello&page=2'));

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual('?q=hello&page=2');
    });
});
