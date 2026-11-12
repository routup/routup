import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from 'vitest';
import {
    App,
    defineCoreHandler,
    defineErrorHandler,
    toNodeHandler,
} from '../../../src/_entries/node.ts';

/**
 * What actually goes over the socket. `app.fetch()` hands the Node.js
 * adapter a response object it serializes without going through the
 * Web `Response` body stream, so the status line, headers and body are
 * asserted from the client side of a real `node:http` server.
 */
describe('routing/wire', () => {
    const app = new App();

    app.use(defineCoreHandler(async (event) => {
        const response = await event.next();

        // Set after the downstream response was built — must not leak.
        event.response.headers.set('x-late', '1');

        return response;
    }));

    app.get('/text', defineCoreHandler(() => 'héllo'));
    app.get('/json', defineCoreHandler(() => ({ hello: 'wörld' })));
    app.get('/array', defineCoreHandler(() => [1, 2]));
    app.get('/number', defineCoreHandler(() => 42));
    app.get('/null', defineCoreHandler((event) => {
        event.response.status = 204;

        return null;
    }));
    app.get('/binary', defineCoreHandler(() => new Uint8Array([1, 2, 3])));
    app.get('/buffer', defineCoreHandler(() => new Uint8Array([4, 5]).buffer));
    app.get('/blob', defineCoreHandler(() => new Blob(['blob'], { type: 'text/x-blob' })));
    app.get('/stream', defineCoreHandler(() => new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode('a'));
            controller.enqueue(new TextEncoder().encode('b'));
            controller.close();
        },
    })));
    app.get('/response', defineCoreHandler(() => new Response('raw', {
        status: 202,
        headers: { 'x-raw': '1' },
    })));
    app.get('/custom', defineCoreHandler((event) => {
        event.response.status = 201;
        event.response.headers.set('x-custom', 'value');
        event.response.headers.set('content-type', 'text/html; charset=utf-8');
        event.response.headers.append('set-cookie', 'a=1');
        event.response.headers.append('set-cookie', 'b=2');

        return '<p>ok</p>';
    }));
    app.get('/users/:id', defineCoreHandler((event) => ({
        id: event.params.id,
        path: event.path,
        q: event.searchParams.getAll('q'),
    })));
    app.get('/throw', defineCoreHandler(() => {
        throw new Error('boom');
    }));
    app.get('/handled', defineCoreHandler(() => {
        throw new Error('handled');
    }));
    app.use(defineErrorHandler((error, event) => {
        if (error.message !== 'handled') {
            throw error;
        }

        event.response.status = 418;

        return { message: error.message };
    }));

    const server = createServer(toNodeHandler(app));
    let origin: string;

    beforeAll(async () => {
        server.listen(0, '127.0.0.1');
        await once(server, 'listening');

        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(() => {
        server.close();
        server.closeAllConnections();
    });

    it('sends a string as text/plain with a byte-accurate content-length', async () => {
        const response = await fetch(`${origin}/text`);

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
        expect(response.headers.get('content-length')).toBe('6');
        expect(await response.text()).toBe('héllo');
    });

    it('sends an object as JSON with a byte-accurate content-length', async () => {
        const response = await fetch(`${origin}/json`);

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
        expect(response.headers.get('content-length')).toBe('18');
        expect(await response.json()).toEqual({ hello: 'wörld' });
    });

    it.each([
        ['/array', [1, 2]],
        ['/number', 42],
    ])('sends %s as JSON', async (path, expected) => {
        const response = await fetch(`${origin}${path}`);

        expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
        expect(await response.json()).toEqual(expected);
    });

    it('sends null as an empty body with the accumulated status', async () => {
        const response = await fetch(`${origin}/null`);

        expect(response.status).toBe(204);
        expect(await response.text()).toBe('');
    });

    it.each([
        ['/binary', [1, 2, 3]],
        ['/buffer', [4, 5]],
    ])('sends %s as application/octet-stream', async (path, bytes) => {
        const response = await fetch(`${origin}${path}`);

        expect(response.headers.get('content-type')).toBe('application/octet-stream');
        expect(response.headers.get('content-length')).toBe(String(bytes.length));
        expect([...new Uint8Array(await response.arrayBuffer())]).toEqual(bytes);
    });

    it('sends a Blob with its own type', async () => {
        const response = await fetch(`${origin}/blob`);

        expect(response.headers.get('content-type')).toBe('text/x-blob');
        expect(await response.text()).toBe('blob');
    });

    it('sends a ReadableStream chunk by chunk', async () => {
        const response = await fetch(`${origin}/stream`);

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('ab');
    });

    it('passes a handler-built Response through untouched', async () => {
        const response = await fetch(`${origin}/response`);

        expect(response.status).toBe(202);
        expect(response.headers.get('x-raw')).toBe('1');
        expect(await response.text()).toBe('raw');
    });

    it('sends the accumulated status, headers and every set-cookie', async () => {
        const response = await fetch(`${origin}/custom`);

        expect(response.status).toBe(201);
        expect(response.headers.get('x-custom')).toBe('value');
        expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
        expect(response.headers.getSetCookie()).toEqual(['a=1', 'b=2']);
        expect(await response.text()).toBe('<p>ok</p>');
    });

    it('does not send headers set after the response was built', async () => {
        const response = await fetch(`${origin}/text`);

        expect(response.headers.has('x-late')).toBe(false);
    });

    it('sends an error handler result with its status', async () => {
        const response = await fetch(`${origin}/handled`);

        expect(response.status).toBe(418);
        expect(await response.json()).toEqual({ message: 'handled' });
    });

    it('sends the fallback for an unhandled error and for no match', async () => {
        const failed = await fetch(`${origin}/throw`, { headers: { accept: 'application/json' } });

        expect(failed.status).toBe(500);
        expect(await failed.json()).toEqual({ status: 500, message: 'boom' });

        const missing = await fetch(`${origin}/missing`, { headers: { accept: 'text/plain' } });

        expect(missing.status).toBe(404);
        expect(await missing.text()).toBe('Not Found');
    });

    it('reads path, params and query from the incoming request', async () => {
        const response = await fetch(`${origin}/users/a%20b?q=1&q=x%26y`);

        expect(await response.json()).toEqual({
            id: 'a b',
            path: '/users/a%20b',
            q: ['1', 'x&y'],
        });
    });

    it('answers HEAD without a body', async () => {
        const response = await fetch(`${origin}/json`, { method: 'HEAD' });

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
        expect(await response.text()).toBe('');
    });
});
