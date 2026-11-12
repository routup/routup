import { once } from 'node:events';
import { createServer } from 'node:http';
import { connect, createServer as createHttp2Server } from 'node:http2';
import type { AddressInfo } from 'node:net';
import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler, toNodeHandler } from '../../src/_entries/node.ts';

function createApp() {
    const app = new App();

    app.get('/', defineCoreHandler(() => 'ok'));

    return app;
}

describe('toNodeHandler', () => {
    it('serves requests through a node:http server', async () => {
        const server = createServer(toNodeHandler(createApp()));

        server.listen(0, '127.0.0.1');
        await once(server, 'listening');

        try {
            const { port } = server.address() as AddressInfo;
            const response = await fetch(`http://127.0.0.1:${port}/`);

            expect(response.status).toBe(200);
            await expect(response.text()).resolves.toBe('ok');
        } finally {
            server.close();
            server.closeAllConnections();
        }
    });

    it('serves requests through a node:http2 server', async () => {
        const server = createHttp2Server(toNodeHandler(createApp()));

        server.listen(0, '127.0.0.1');
        await once(server, 'listening');

        const { port } = server.address() as AddressInfo;
        const client = connect(`http://127.0.0.1:${port}`);
        const closed = new Promise<void>((resolve) => {
            client.once('close', () => resolve());
        });

        try {
            const request = client.request({ ':path': '/' });
            const [headers] = await once(request, 'response');

            request.setEncoding('utf8');

            let body = '';

            for await (const chunk of request) {
                body += chunk;
            }

            expect(headers[':status']).toBe(200);
            expect(body).toBe('ok');
        } finally {
            client.destroy();
            await closed;
            server.close();
        }
    });
});
