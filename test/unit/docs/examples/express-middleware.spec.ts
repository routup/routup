import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from 'vitest';
import { app } from '../../../../docs/examples/express-middleware/app.ts';
import { toNodeHandler } from '../../../../src/_entries/node.ts';

// The Node adapters read `req` and `res` of a Node server from the request,
// so the app runs behind `node:http` instead of `app.fetch()`.
const server = createServer(toNodeHandler(app));
let baseURL: string;

beforeAll(async () => {
    await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', resolve);
    });

    const { port } = server.address() as AddressInfo;

    baseURL = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
    await new Promise((resolve) => {
        server.close(resolve);
    });
});

describe('docs/examples/express-middleware', () => {
    it('should set the header from the middleware and return the downstream body', async () => {
        const response = await fetch(`${baseURL}/`);

        expect(response.status).toBe(200);
        expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
        expect(await response.text()).toBe('Hello');
    });

    it('should not run without a Node.js server', async () => {
        const response = await app.fetch(new Request('http://localhost/'));

        expect(response.status).toBe(500);
    });
});
